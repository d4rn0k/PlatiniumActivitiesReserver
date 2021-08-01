#!/usr/bin/env node

const axios = require('axios');
const moment = require('moment');
const {sleepMs, printRequestError, exitProgram, mergeDateWithTime} = require('./utils')

const {
  restActions,
  classStatuses,
  clubIds,
  dayWithTimeDateFormat,
  exitReasons,
  maxRequestCount,
  platiniumBaseUrl,
  platiniumDateFormat,
  platiniumClassDateFormat,
  sleepBetweenRequestMs,
  timeBeforeStartFirstRequestMs,
  maximumFutureDateTimeToReserve
} = require('./constants');
const {loginAndSetCookie} = require('./auth');
const {userInput} = require("./commandLine.js");

async function getCalendarFilters() {
  return axios
    .post(`${platiniumBaseUrl}${restActions.getCalendarFilters}`, {clubId: clubIds.alejaPokoju16})
    .then(response => response.data.TimeTableFilters)
    .catch(printRequestError)
}

function bookAllClasses(bookings) {
  return Promise.all(bookings.map(booking => bookSingleClass(booking)))
}

function isClassAlreadyReserved(responseCode, responseData) {
  return responseCode === 499 || (responseCode === 500 && responseData.search('Class already booked') !== -1);
}

async function bookSingleClass(booking) {
  return axios
    .post(`${platiniumBaseUrl}${restActions.bookClass}`, {classId: booking.Id})
    .then(result => {
        if (result.status === 200) {
          exitProgram(exitReasons.reservedOk, true);
        }
      }
    ).catch(result => {
        console.error("Error when try to book single class: ", result)
        const response = result.response;
        const responseCode = response.status;
        const responseData = response.data;

        if (isClassAlreadyReserved(responseCode, responseData)) {
          exitProgram(exitReasons.reservedOk, true);
        }
        if (responseData.search('Booking to late') !== -1) {
          exitProgram(exitReasons.alreadyBooked, false);
        } else if (responseData.search('Booking to soon') !== -1) {
          exitProgram(exitReasons.noRequiredParameters, false); //TODO: adjust exit message
        } else if (responseData.search('User booking limit reached') !== -1) {
          exitProgram(exitReasons.alreadyBooked, false);//TODO: adjust exit message
        } else {
          console.error(`Unknown error [Name: ${booking.Name}, Id: ${booking.Id}, StartTime: ${booking.StartTime}], ` +
            `ErrorCode: ${JSON.stringify(responseCode)}`);
          exitProgram(exitReasons.unknownError, false);
        }
      }
    )
}

async function getCalendarData(timeTableId) {
  return axios.post(`${platiniumBaseUrl}${restActions.getDailyListClasses}`, {
    clubId: clubIds.alejaPokoju16,
    date: userInput.date.format(platiniumDateFormat),
    timeTableId
  }).then(response => response.data.CalendarData)
    .catch(printRequestError)
}

function getAvailableBookings(calendarData, dateTime) {
  return calendarData
    .flatMap(calendarData => calendarData.Classes)
    .filter(({StartTime}) => StartTime === dateTime.format(platiniumClassDateFormat))
    .filter(({Status}) => Status === classStatuses.bookable);
}

function getDurationToTimeToReserve(dateTime) {
  return moment
    .duration(dateTime.diff(new moment()))
    .subtract(maximumFutureDateTimeToReserve.value, maximumFutureDateTimeToReserve.unit);
}

function getTimeTableId(calendarFilters) {
  return calendarFilters.find(item => item.Name.toLocaleLowerCase().includes(userInput.activity.toLocaleLowerCase())).Id
}

function printAvailableBookings(availableBookings) {
  console.log('We want to reserve this activities:');
  availableBookings.forEach(activity =>
    console.success(`[${activity.Name}]: ${moment(activity.StartTime).format(dayWithTimeDateFormat)}`)
  );
}

async function main() {
  const userDateTime = mergeDateWithTime(userInput.date, userInput.time);

  if (userDateTime.isBefore(moment())) {
    exitProgram(exitReasons.pastDate, false);
  }
  await loginAndSetCookie(userInput.username, userInput.password);

  const calendarFilters = await getCalendarFilters();
  const timeTableId = getTimeTableId(calendarFilters);

  if (timeTableId === undefined) {
    //TODO: refactor and use formatter function
    console.error(`No activity found. Did you type correct activity name? Activity: "${userInput.activity}"`);
    process.exit(exitReasons.noActivityFound.id);
  }

  const calendarData = await getCalendarData(timeTableId);
  const availableBookings = await getAvailableBookings(calendarData, userDateTime)

  if (availableBookings.length === 0) {
    exitProgram(exitReasons.alreadyBooked, false); //TODO change msg
  }
  printAvailableBookings(availableBookings);

  const durationToTimeToReserve = getDurationToTimeToReserve(userDateTime);

  // If reservation is possible then try to reserve now, if not then wait until it's possible (a few minutes, hours etc.)
  if (durationToTimeToReserve.asDays() < 0) {
    console.log(`I'm trying to reserve now!`);
    await bookAllClasses(availableBookings);
  } else {
    console.log(`I must wait to reserve activity!`);
    await sleepMs(durationToTimeToReserve.asMilliseconds() - timeBeforeStartFirstRequestMs);

    for (let testCount = 0; testCount < maxRequestCount; testCount++) {
      //Missing await below is intentionally, we do not to wait to finish request, we need to run them after sleep
      bookAllClasses(availableBookings);
      await sleepMs(sleepBetweenRequestMs);
    }
  }
}

main();
