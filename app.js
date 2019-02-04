#!/usr/bin/env node

const program = require('commander');
const axios = require('axios');
const moment = require('moment');
const colors = require('colors');

console.error = inputString => console.log(colors.red(inputString));
console.success = inputString => console.log(colors.green(inputString));

const sleepMs = waitTimeInMs => new Promise(resolve => {
  console.log(`Sleeping for: ${moment().startOf('day').milliseconds(waitTimeInMs).format('DD[d] HH[h] mm[m] ss[s] SSS[ms]')}`);
  setTimeout(resolve, waitTimeInMs);
});
const platiniumBaseUrl = 'https://platinium.perfectgym.pl/ClientPortal2/';
const actions = {
  login: 'Auth/Login',
  postWeeklyListClasses: 'Classes/ClassCalendar/WeeklyListClasses',
  bookClass: 'Classes/ClassCalendar/BookClass'
};
const platiniumDateFormat = 'YYYY-MM-DDTHH:mm:ss';
const customDateFormat = 'YYYY-MM-DD HH:mm:ss';
const clubs = {
  alejaPokoju16: 16
};
const exitCodes = {
  reservedOk: 0,
  invalidParameter: 1,
  noRequiredParameters: 2,
  incorrectCredentials: 3,
  noActivityFound: 4,
  alreadyBooked: 5,
  unknownError: 6,
  pastDate: 7
};

axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/72.0.3617.0 Safari/537.36';
axios.defaults.withCredentials = true;

program
  .version('0.0.5')
  .option('-u, --username <username>', 'username (email)')
  .option('-p, --password <password>', 'password')
  .option('-a, --activity <activity>', `activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'`)
  .option('-d, --date <date> ', 'date in DD-MM-YYYY format, e.g 15-01-2019', (dateParameter) => {
    return moment(dateParameter, 'DD-MM-YYYY').startOf('day');
  })
  .option('-t, --time <time> ', 'time in HH:MM format, e.g 19:30', (time) => {
    const regexp = new RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!regexp.test(time)) {
      throw 'Wrong time format! Please type time with HH:MM format e.g: 09:30, 20:00.'
    }
    const parsedTime = time.match(regexp);
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

console.log(`Current time: ${(new moment()).format(customDateFormat)}`);
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
  await axios({
    method: 'post',
    url: platiniumBaseUrl + actions.login,
    withCredentials: true,
    headers: {
      cookie: 'ClientPortal.Embed;'
    },
    data: {
      Login: program.username,
      Password: program.password,
      RememberMe: true
    }
  }).then(result => {
    axios.defaults.headers.cookie = `ClientPortal.Embed; ${result.headers['set-cookie'][0].split(';')[0]}`
  }).catch(() => {
    console.error('Incorrect username / password or server error.');
    process.exit(exitCodes.incorrectCredentials);
  });

  const calendarData = await axios.post(platiniumBaseUrl + actions.postWeeklyListClasses, {
    clubId: clubs.alejaPokoju16,
    search: program.activity,
    date: program.date.format(platiniumDateFormat)
  }).then(response => response.data.CalendarData)
    .catch(error => {
      console.error('Can\'t make POST request. Error:', JSON.stringify(error));
    });

  const requiredCalendarItem = calendarData.find(calendarItem => calendarItem.Day === program.date.format(platiniumDateFormat));

  if (requiredCalendarItem === undefined) {
    console.error(`No activity found. Did you type correct activity name? Activity: "${program.activity}"`);
    process.exit(exitCodes.noActivityFound);
  }

  let bookings = requiredCalendarItem.Classes
    .filter(singleClass => singleClass.StartTime === givenMomentTime.format(platiniumDateFormat) &&
      (singleClass.Status === 'Bookable' || singleClass.Status === 'Unavailable'));

  if (bookings.length === 0) {
    console.error('No available bookings. All activities has been reserved.');
    process.exit(exitCodes.alreadyBooked);
  }

  console.log('We want to reserve this activities:');
  bookings.forEach(activity =>
    console.success(`[${activity.Name}]: ${moment(activity.StartTime, platiniumDateFormat).format(customDateFormat)}`)
  );
  const bookClasses = bookings => Promise.all(bookings.map(booking => bookClass(booking)));
  const bookClass = booking =>
    axios({
      method: 'post',
      url: platiniumBaseUrl + actions.bookClass,
      withCredentials: true,
      data: {classId: booking.Id}
    }).then(result => {
        if (result.status === 200) {
          console.success('Booked successfully!');
          process.exit(exitCodes.reservedOk);
        }
      }
    ).catch(result => {
        if ((result.response.status === 499 && result.response.data.Errors[0].Code === 'ClassAlreadyBooked') ||
          (result.response.status === 500 && result.response.data.search('Class already booked') !== -1)) {
          console.success('Already booked! OK');
          process.exit(exitCodes.reservedOk);
        }
        if (result.response.data.search('Booking to late') !== -1) {
          console.error('Activity has been reserved! Too late!');
          throw 'Activity has been reserved! Too late!';
        } else if (result.response.data.search('Booking to soon') !== -1) {
          console.error('Booking too soon!');
          throw 'Booking too soon!';
        } else if (result.response.data.search('User booking limit reached') !== -1) {
          console.error('Already booked');
          throw 'Already booked';
        } else {
          console.error(`Unknown error [Name: ${booking.Name}, Id: ${booking.Id}, StartTime: ${booking.StartTime}], ` +
            `ErrorCode: ${JSON.stringify(result.response.status)}`);
          throw `Unknown error`;
        }
      }
    );

  const durationToTimeToReserve = moment.duration(givenMomentTime.diff(new moment())).subtract(7, 'days');
  if (durationToTimeToReserve.asDays() < 7) {

    console.log(`I'm trying to reserve now!`);
    await bookClasses(bookings).catch(reason => {
      console.error(reason);

      switch (reason) {
        case 'Already booked' :
          process.exit(exitCodes.alreadyBooked);
          break;
        case 'Activity has been reserved! Too late!' :
          process.exit();
          break;
        case 'Unknown error' :
          process.exit(exitCodes.unknownError);
          break;
      }
    });
  }
  console.log(`I must wait to reserve activity!`);
  await sleepMs(durationToTimeToReserve.asMilliseconds() - 150);

  const maxRequestCount = 20;
  for (let testCount = 0; testCount < maxRequestCount; testCount++) {
    bookClasses(bookings);
    sleepMs(15);
  }
})();
