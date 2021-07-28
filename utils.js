const colors = require('colors');
const moment = require('moment');

console.error = inputString => console.log(colors.red(inputString));
console.success = inputString => console.log(colors.green(inputString));

function sleepMs(waitTimeInMs) {
  return new Promise(resolve => {
    console.log(`Sleeping for: ${durationToString(moment.duration(waitTimeInMs, 'ms'))}`);
    setTimeout(resolve, waitTimeInMs);
  })
}

function durationToString(duration) {
  return `${duration.days()}[d] ${duration.hours()}[h] ${duration.minutes()}[m] ${duration.seconds()}[s] ${duration.milliseconds()}[ms]`
}

function mergeDateWithTime(momentDate, momentTime) {
  return momentDate.clone().hour(momentTime.hour()).minute(momentTime.minute());
}

function printRequestError(error) {
  console.error(`Can't make request. Error: ${error.message}`)
}

function exitProgram(exitReason, successfully) {
  if (successfully) {
    console.success(exitReason.message);
  } else {
    console.error(exitReason.message);
  }
  process.exit(exitReason.id);
}


module.exports = {
  sleepMs,
  printRequestError,
  exitProgram,
  mergeDateWithTime
}
