const colors = require('colors');

const sleepMs = waitTimeInMs => new Promise(resolve => {
  console.log(`Sleeping for: ${durationToString(moment.duration(waitTimeInMs, 'ms'))}`);
  setTimeout(resolve, waitTimeInMs);
});
const durationToString = duration => `${duration.days()}[d] ${duration.hours()}[h] ${duration.minutes()}[m] ${duration.seconds()}[s]` +
  ` ${duration.milliseconds()}[ms]`;

const printError = (error) => console.error(`Can't make request. Error: ${error.message}`);

console.error = inputString => console.log(colors.red(inputString));
console.success = inputString => console.log(colors.green(inputString));


module.exports = {
  sleepMs,
  durationToString,
  printError
}
