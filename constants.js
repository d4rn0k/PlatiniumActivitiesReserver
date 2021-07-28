const moment = require("moment");

const platiniumBaseUrl = 'https://platinium.perfectgym.pl/ClientPortal2/';
const actions = {
  login: 'Auth/Login',
  getDailyListClasses: 'Classes/ClassCalendar/DailyClasses',
  getCalendarFilters: 'Classes/ClassCalendar/GetCalendarFilters',
  bookClass: 'Classes/ClassCalendar/BookClass'
};

const clubIds = {
  alejaPokoju16: 16
};

const platiniumDateFormat = 'YYYY-MM-DD';
const platiniumClassDateFormat = 'YYYY-MM-DDTHH:mm:ss';
const dayWithTimeDateFormat = 'YYYY-MM-DD HH:mm:ss';
const timeFormatUserPattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

const exitReasons = {
  reservedOk: {id: 0, message: 'Booked successfully!'},
  invalidParameter: {id: 1, message: ''},
  noRequiredParameters: {id: 2, message: 'Please pass all required parameters.'},
  incorrectCredentials: {id: 3, message: 'Incorrect credentials or server error.'},
  noActivityFound: {id: 4, message: ''},
  alreadyBooked: {id: 5, message: 'No available bookings. All activities has been reserved.'},
  unknownError: {id: 6, message: 'Unknown error.'},
  pastDate: {id: 7, message: 'Wrong activity desired time. Please type future date.'},
};

const maximumFutureDateTimeToReserve = {
  value: 7,
  unit: 'days'
}
const maxRequestCount = 20;
const sleepBetweenRequestMs = 15;
const timeBeforeStartFirstRequestMs = 150;
const classStatuses = {
  bookable: 'Bookable'
};
const currentDateTime = new moment();

module.exports = {
  actions,
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
  timeFormatUserPattern,
  maximumFutureDateTimeToReserve,
  currentDateTime
}
