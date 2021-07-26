const platiniumBaseUrl = 'https://platinium.perfectgym.pl/ClientPortal2/';
const actions = {
  login: 'Auth/Login',
  getDailyListClasses: 'Classes/ClassCalendar/DailyClasses',
  bookClass: 'Classes/ClassCalendar/BookClass',
  getCalendarFilters: 'Classes/ClassCalendar/GetCalendarFilters'
};

const clubIds = {
  alejaPokoju16: 16
};

const platiniumDateFormat = 'YYYY-MM-DD';
const platiniumClassDateFormat = 'YYYY-MM-DDTHH:mm:ss';
const customDateFormat = 'YYYY-MM-DD HH:mm:ss';

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

const maxRequestCount = 20;
const sleepBetweenRequestMs = 15;
const timeBeforeStartFirstRequestMs = 150;
const classStatuses = {
  bookable: 'Bookable'
};

module.exports = {
  actions,
  classStatuses,
  clubIds,
  customDateFormat,
  exitCodes,
  maxRequestCount,
  platiniumBaseUrl,
  platiniumDateFormat,
  platiniumClassDateFormat,
  sleepBetweenRequestMs,
  timeBeforeStartFirstRequestMs
}
