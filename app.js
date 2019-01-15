#!/usr/bin/env node
const program = require('commander');
const axios = require('axios');
const moment = require('moment');
const colors = require('colors');

console.error = (inputString) => console.log(inputString.red);

const platiniumBaseurl = 'https://platinium.perfectgym.pl/ClientPortal2/',
  actions = {
    login: 'Auth/Login',
    postWeeklyListClasses: 'Classes/ClassCalendar/WeeklyListClasses',
    bookClass: 'Classes/ClassCalendar/BookClass'
  },
  platiniumDateFormat = 'YYYY-MM-DDTHH:mm:SS',
  clubs = {
    alejaPokoju16: 16
  },
  selectors = {
    loginInput: 'input[name=Login]',
    passwordInput: 'input[name=Password]',
    loginButton: '#confirm > span.baf-button-text',
    bookAClassButton: 'a[href="#/Classes/"]',
    searchInput: 'input[placeholder="Search..."]'
  };

axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3617.0 Safari/537.36';
axios.defaults.withCredentials = true;

program
  .version('0.0.5')
  .option('-u, --username <username>', 'Username (email)')
  .option('-p, --password <password>', 'Password')
  .option('-a, --activity <activity>', `Activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'`)
  .option('-d, --date <date> ', 'Date in DD-MM-YYYY format, e.g 15-01-2019', (dateParameter) => {
    return moment(dateParameter, 'DD-MM-YYYY').startOf('day');
  })
  .option('-t, --time <time> ', 'Time in HH:MM format, e.g 19:30', (time) => {
    const regexp = new RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!regexp.test(time)) {
      throw 'Wrong time format! Please type time with HH:MM format e.g: 19:30, 16:45.'
    }
    const parsedTime = time.match(regexp);
    return {
      hour: parsedTime[1],
      minute: parsedTime[2]
    };
  })
  .parse(process.argv)
  .on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });


console.log(`Params: -u: ${program.username}, -p: ${program.password}, -d: ${JSON.stringify(program.date)} -t: ${JSON.stringify(program.time)}`.blue);


(async () => {
  let calendarData;
  await axios({
    method: 'post',
    url: platiniumBaseurl + actions.login,
    withCredentials: true,
    headers: {
      cookie: 'ClientPortal.Embed;'
    },
    data: {
      Login: program.username,
      Password: program.password,
      RememberMe: true
    }
  }).then((result) => {
    axios.defaults.headers.cookie = `ClientPortal.Embed; ${result.headers['set-cookie'][0].split(';')[0]}`
    // axios.defaults.headers.cookie = result;
  }).catch(result => {
    console.error('Incorrect username / password or server error.');
    process.exit(1);
  });

  await axios.post(platiniumBaseurl + actions.postWeeklyListClasses, {
    clubId: clubs.alejaPokoju16,
    search: program.activity,
    date: program.date.format(platiniumDateFormat)
  }).then(response => {
    calendarData = response.data.CalendarData;
  }).catch(error => {
    console.error('Can\'t make POST request. Error:', JSON.stringify(error));
  });

  let bookings = calendarData
    .find(calendarItem => calendarItem.Day === program.date.format(platiniumDateFormat))
    .Classes
    .filter(clazz => clazz.StartTime === program.date.hour(program.time.hour).minute(program.time.minute).format(platiniumDateFormat));

  console.log(`We want to reserve this activities:`.green);
  bookings.forEach(activity => console.log(`${activity.Name}`.green));

  let booking = bookings[0];


  await axios({
    method: 'post',
    url: platiniumBaseurl + actions.bookClass,
    withCredentials: true,
    data: {classId: '272882'}
  }).then(result => {
      if (result.status === 200) {
        console.log('Booked successfully!'.green);
      }
    }
  ).catch(result => {
      if ((result.response.status === 499 && result.response.data.Errors[0].Code === 'ClassAlreadyBooked') ||
        (result.response.status === 500 && result.response.data.search('Class already booked') !== -1)) {
        console.log('Already booked! OK'.green);
        process.exit(0);
      }
      console.log(`Error when booking [Name: ${booking.Name}, Id: ${booking.Id}, StartTime: ${booking.StartTime}], ErrorCode: ${JSON.stringify(result.response.status)}`.red)
      process.exit(2);
    }
  );
})();
