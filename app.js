#!/usr/bin/env node
const puppeteer = require('puppeteer');
const program = require('commander');
const axios = require('axios');
const moment = require('moment');
const colors = require('colors');

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

  await page.waitForSelector(selectors.bookAClassButton);
  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, [selectors.bookAClassButton]);

  await page.waitForSelector(selectors.searchInput);
  await page.focus(selectors.searchInput);
  await page.keyboard.type(activityName);

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

  // await page.evaluate(function () {
  //   fetch("https://platinium.perfectgym.pl/ClientPortal2/Classes/ClassCalendar/BookClass", {
  //     "credentials": "include",
  //     "headers": {
  //       "accept": "application/json, text/plain, */*",
  //       "accept-language": "en-US,en;q=0.9",
  //       "cache-control": "public, max-age=31536000",
  //       "content-type": "application/json;charset=UTF-8",
  //       "cp-lang": "en",
  //       "cp-mode": "desktop",
  //       "x-requested-with": "XMLHttpRequest"
  //     },
  //     "referrer": "https://platinium.perfectgym.pl/ClientPortal2/",
  //     "referrerPolicy": "no-referrer-when-downgrade",
  //     "body": "{\"classId\":274629}",
  //     "method": "POST",
  //     "mode": "cors"
  //   })
  //     .then(result => console.log(result))
  //     .catch(error => console.log(error));
  // });

  // await axios.post('https://platinium.perfectgym.pl/ClientPortal2/Classes/ClassCalendar/WeeklyListClasses', {clubId: "16"})
  //   .then((result) =>
  //     console.log(`Booked successfully! [Status: ${result.status} ${result.statusText}]`)
  //   ).catch(error =>
  //     console.log(`Error when booking [Name: ${booking.name}, Id: ${booking.id}, StartTime: ${booking.startTime}],
  //      ErrorCode: ${JSON.stringify(error.response.status)}`)
  //   );


  await axios({
    method: 'post',
    url: platiniumBaseurl + actions.bookClass,
    data: {classId: '272882'},
    headers: {
      cookie: "ClientPortal.Embed; .AspNet.ApplicationCookie=TKS0wCR89nSkFddTlCG3nKp4TRG8Ox6DqqSzDLSYXy2xQ9rPdJ3YMW5CAmDCv9X7pE2J8ze1q6S0H3FQl74m5NeikVcKW5fZMQ7kWPji7lCcbV3S55I8KJiX6ujpFuzeDdNOwwkLhsVyDPS7y1X7aXi5iD0KvV_U3MFH38-8-0AMrhJU26W-5d1xkF5fnvelLX6Gn0w8-AZUN" +
        "mFhqML8TH2Mo0Hxl6k0mbrQnRjLeH_iYvmkBHjgioUZMBUdS3d9ojS5WjJ7_3u2MTCSGK8yaY1Fj-3tv7kKI8a5HRfUAWiuJR_LHQAZMuwxJ2wC43OC_k9AA0UeWr4Dee9yPe1Jglt4dTtl7ZouYXzn5_r178nP91U-Jpoi6cwn8RxLpuRcNlkDZDwr9iPfhxey767rzYrKjA9DbRCFnvwtd3GOhtChMaZlfM5MatD96iAMHP6xcFn2IXLv_3tjBEoYFtYn99DybwEQLfwyN0-uELt2iBXDsN8_Eo69PeO0VPMOTMYCjTJMYEh-GxEmnmQNM8M0g_uOBbegjM5SkjNikoBYReIoMjuVBmNrVWPFiXl1Sr97TZNFltP369yoZIgBPdCvn8cNsr2YhOs6Vl_6MJo8_VrnHf9P_TpE0StZEQ_-gAmR1vnTbL8fuPSwLw2BKiyeYClmGCWqWWhbJlPpFcdvCeCeas3clYoonuxbRYe2BcKD5NUNPKPrOLZReob7AsYhyoDVB8yzRo_MyuO8xPG_SMwxUlWN6ul1vnIogxfiluZQhDp4-U3qmpgqnq29oz0e_g",
    }
  }).then(result => {
      if (result.status === 200) {
        console.log('Booked successfully!'.green);
      }
    }
  ).catch(result => {
      if (result.response.status === 499 && result.response.data.Errors[0].Code === 'ClassAlreadyBooked') {
        console.log('Already booked! OK'.green);
      }
      console.log(`Error when booking [Name: ${booking.name}, Id: ${booking.id}, StartTime: ${booking.startTime}], ErrorCode: ${JSON.stringify(result.response.status)}`.red)
    }
  );

  await page.screenshot({path: 'platiniumPageScreenshot.png'});

  await browser.close();
})();
