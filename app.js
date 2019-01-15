#!/usr/bin/env node
const puppeteer = require('puppeteer');
const program = require('commander');
const axios = require('axios');
const moment = require('moment');

const platiniumBaseurl = 'https://platinium.perfectgym.pl/ClientPortal2/',
  actions = {
    login: '#/Login',
    postWeeklyListClasses: 'Classes/ClassCalendar/WeeklyListClasses',
    bookClass: 'Classes/ClassCalendar/BookClass'
  },
  platiniumDateFormat = 'YYYY-MM-DDTHH:mm:SS',
//Todo: Make this parameter
  activityName = 'squash',
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

program
  .version('0.0.5')
  .option('-u, --username <username>', 'Username (email)')
  .option('-p, --password <password>', 'Password')
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
  .parse(process.argv);

console.log(`Params: -u: ${program.username}, -p: ${program.password},-d: ${JSON.stringify(program.date)} -t: ${JSON.stringify(program.time)}`);


(async () => {
  const browser = await puppeteer.launch({headless: false, slowMo: 0});
  const page = await browser.newPage();
  await page.goto(platiniumBaseurl + actions.login);

  await page.waitForSelector(selectors.loginInput);
  await page.waitForSelector(selectors.passwordInput);
  await page.waitForSelector(selectors.loginButton);

  await page.focus(selectors.loginInput);
  await page.keyboard.type(program.username);

  await page.focus(selectors.passwordInput);
  await page.keyboard.type(program.password);

  await page.click(selectors.loginButton);
  //Logged

  // await page.waitForSelector(selectors.bookAClassButton);
  // await page.evaluate((selector) => {
  //   document.querySelector(selector).click();
  // }, [selectors.bookAClassButton]);
  //
  // await page.waitForSelector(selectors.searchInput);
  // await page.focus(selectors.searchInput);
  // await page.keyboard.type(activityName);

  let calendarData;
  await axios.post(platiniumBaseurl + actions.postWeeklyListClasses, {
    clubId: clubs.alejaPokoju16,
    search: activityName,
    date: program.date.format(platiniumDateFormat)
  }).then(response => {
    calendarData = response.data.CalendarData;

    // console.log(response);
  }).catch(error => {
    console.error('Can\'t make POST request. Error:', JSON.stringify(error));
  });

  let bookings = calendarData
    .find(calendarItem => calendarItem.Day === program.date.format(platiniumDateFormat))
    .Classes
    .filter(clazz => clazz.StartTime === program.date.hour(program.time.hour).minute(program.time.minute).format(platiniumDateFormat));

  let booking = bookings[0];

  axios.defaults.headers.cookie = await page.evaluate(() => document.cookie);
  axios.defaults.headers.origin = 'https://platinium.perfectgym.pl';
  axios.defaults.headers.referer = 'https://platinium.perfectgym.pl/ClientPortal2/';
  axios.defaults.headers['x-requested-with'] = 'XMLHttpRequest';
  axios.defaults.headers['cp-lang'] = 'en';
  axios.defaults.headers['cp-mode'] = 'desktop';
  axios.defaults.headers['accept-encoding'] = 'gzip, deflate, br';
  axios.defaults.headers['accept-language'] = 'en-US,en;q=0.9';
  axios.defaults.headers['cache-control'] = 'public, max-age=31536000';

  await page.evaluate(function () {
    fetch("https://platinium.perfectgym.pl/ClientPortal2/Classes/ClassCalendar/BookClass", {
      "credentials": "include",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "public, max-age=31536000",
        "content-type": "application/json;charset=UTF-8",
        "cp-lang": "en",
        "cp-mode": "desktop",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://platinium.perfectgym.pl/ClientPortal2/",
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": "{\"classId\":274629}",
      "method": "POST",
      "mode": "cors"
    })
      .then(result => console.log(result))
      .catch(error => console.log(error));
  });

  await axios.get('https://platinium.perfectgym.pl/ClientPortal2/Classes/ClassCalendar/WeeklyListClasses', {clubId: "16"})
    .then(() =>
      console.log('Booked successfully!')
    ).catch(error =>
      console.log(`Error when booking [Name: ${booking.name}, Id: ${booking.id}, StartTime: ${booking.startTime}],
       ErrorCode: ${JSON.stringify(error.response.status)}`)
    );


  await axios.post(platiniumBaseurl + actions.bookClass, {
    classId: '275492'
  }).then(() =>
    console.log('Booked successfully!')
  ).catch(error =>
    console.log(`Error when booking [Name: ${booking.name}, Id: ${booking.id}, StartTime: ${booking.startTime}], ErrorCode: ${JSON.stringify(error.response.status)}`)
  );

  await page.screenshot({path: 'platiniumPageScreenshot.png'});

  await browser.close();
})();
