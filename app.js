#!/usr/bin/env node

const program = require('commander');
const axios = require('axios');
const moment = require('moment');
const utils = require('./utils')
const constants = require('./constants')
const auth = require('./auth')

program
  .version('0.0.7')
  .option('-u, --username <username>', 'username (email)')
  .option('-p, --password <password>', 'password')
  .option('-a, --activity <activity>', `activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'`)
  .option('-d, --date <date> ', 'date in DD-MM-YYYY format, e.g 15-01-2019', (dateParameter) => moment(dateParameter, 'DD-MM-YYYY').startOf('day'))
  .option('-t, --time <time> ', 'time in HH:MM format, e.g 19:30', (time) => {
    const timeFormatPattern = new RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!timeFormatPattern.test(time)) {
      throw 'Wrong time format! Please type time with HH:MM format e.g: 09:30, 20:00.'
    }
    const parsedTime = time.match(timeFormatPattern);
    return {
      hour: parsedTime[1],
      minute: parsedTime[2]
    };
  })
  .parse(process.argv)
  .on('command:*', function () {
    console.error('Invalid parameter: %s\nSee --help for a list of available parameters.', program.args.join(' '));
    process.exit(exitCodes.invalidParameter);
  });

console.log(`Current time: ${(new moment()).format(constants.customDateFormat)}`);
console.log(`Params: -u: "${program.username}", -p: "${program.password}", -d: ${JSON.stringify(program.date)} -t: ` +
  `"${JSON.stringify(program.time)}" -a: "${program.activity}"`);

if (!program.username || !program.password || !program.activity || !program.date || !program.time) {
  console.error('Pass all required parameters');
  program.help();
  process.exit(exitCodes.noRequiredParameters);
}
const givenMomentTime = program.date.clone().hour(program.time.hour).minute(program.time.minute);

if (givenMomentTime.isBefore(moment())) {
  console.error('Wrong activity desired time. Please type future date.');
  process.exit(exitCodes.pastDate);
}

(async () => {
  auth.loginAndSetCookie(program.username, program.password);

  const calendarFilters = await axios
    .post(`${constants.platiniumBaseUrl}${constants.actions.getCalendarFilters}`, {clubId: constants.clubIds.alejaPokoju16})
    .then(response => response.data.TimeTableFilters)
    .catch(utils.printError);

  const timeTableId = calendarFilters.find(item => item.Name.toLocaleLowerCase().includes(program.activity.toLocaleLowerCase())).Id;

  if (timeTableId === undefined) {
    console.error(`No activity found. Did you type correct activity name? Activity: "${program.activity}"`);
  }

  const calendarData = await axios.post(`${constants.platiniumBaseUrl}${constants.actions.getDailyListClasses}`, {
    clubId: constants.clubIds.alejaPokoju16,
    date: program.date.format(constants.platiniumDateFormat),
    timeTableId
  }).then(response => response.data.CalendarData)
    .catch(utils.printError);

  let bookings = calendarData
    .flatMap(calendarData => calendarData.Classes)
    .filter(singleClass => singleClass.StartTime === givenMomentTime.format(constants.platiniumClassDateFormat) && (singleClass.Status === constants.classStatuses.bookable))

  if (bookings.length === 0) {
    console.error('No available bookings. All activities has been reserved.');
    process.exit(constants.exitCodes.alreadyBooked);
  }

  console.log('We want to reserve this activities:');
  bookings.forEach(activity =>
    console.success(`[${activity.Name}]: ${moment(activity.StartTime, constants.platiniumDateFormat).format(constants.customDateFormat)}`)
  );
  const bookAllFoundClasses = bookings => Promise.all(bookings.map(booking => bookSingleClass(booking)));
  const bookSingleClass = booking =>
    axios({
      method: 'post',
      url: `${constants.platiniumBaseUrl}${constants.actions.bookClass}`,
      withCredentials: true,
      data: {classId: booking.Id}
    }).then(result => {
        if (result.status === 200) {
          console.success('Booked successfully!');
          process.exit(constants.exitCodes.reservedOk);
        }
      }
    ).catch(result => {
        if ((result.response.status === 499 && result.response.data.Errors[0].Code === 'ClassAlreadyBooked') ||
          (result.response.status === 500 && result.response.data.search('Class already booked') !== -1)) {
          console.success('Already booked! OK');
          process.exit(constants.exitCodes.reservedOk);
        }
        if (result.response.data.search('Booking to late') !== -1) {
          throw 'Activity has been reserved! Too late!';
        } else if (result.response.data.search('Booking to soon') !== -1) {
          throw 'Booking too soon!';
        } else if (result.response.data.search('User booking limit reached') !== -1) {
          throw 'Already booked';
        } else {
          console.error(`Unknown error [Name: ${booking.Name}, Id: ${booking.Id}, StartTime: ${booking.StartTime}], ` +
            `ErrorCode: ${JSON.stringify(result.response.status)}`);
          throw `Unknown error`;
        }
      }
    );

  const durationToTimeToReserve = moment.duration(givenMomentTime.diff(new moment())).subtract(7, 'days');
  if (durationToTimeToReserve.asDays() < 0) {
    console.log(`I'm trying to reserve now!`);
    await bookAllFoundClasses(bookings).catch(reason => {
      console.error(reason);
      switch (reason) {
        case 'Already booked' :
          process.exit(constants.exitCodes.alreadyBooked);
          break;
        case 'Activity has been reserved! Too late!' :
          process.exit();
          break;
        case 'Unknown error' :
          process.exit(constants.exitCodes.unknownError);
          break;
      }
    });
  }
  console.log(`I must wait to reserve activity!`);

  await utils.sleepMs(durationToTimeToReserve.asMilliseconds() - constants.timeBeforeStartFirstRequestMs);
  for (let testCount = 0; testCount < constants.maxRequestCount; testCount++) {
    bookAllFoundClasses(bookings);
    utils.sleepMs(constants.sleepBetweenRequestMs);
  }
})();
