const program = require("commander");
const moment = require("moment");

const {exitReasons, dayWithTimeDateFormat, timeFormat} = require("./constants");
const {mergeDateWithTime} = require("./utils.js");

const userInput = program
  .version('0.0.8')
  .option('-u, --username <username>', 'username (email)')
  .option('-p, --password <password>', 'password')
  .option('-a, --activity <activity>', `activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'`)
  .option('-d, --date <date> ', 'date in DD-MM-YYYY format, e.g 15-01-2019', dateParameter => moment(dateParameter, 'DD-MM-YYYY').startOf('day'))
  .option('-t, --time <time> ', 'time in HH:MM format, e.g 19:30', time => moment(time, timeFormat))
  .parse(process.argv)
  .on('command:*', () => {
    //TODO: extract into formatter function
    console.error('Invalid parameter: %s\nSee --help for a list of available parameters.', program.args.join(' '));
    process.exit(exitReasons.invalidParameter.id);
  });

console.log(`
Current date    : ${new moment().format(dayWithTimeDateFormat)}
Wanted date     : ${mergeDateWithTime(userInput.date, userInput.time).format(dayWithTimeDateFormat)}
Username(email) : ${userInput.username}
Activity        : ${userInput.activity} 
`);

if (!userInput.username || !userInput.password || !userInput.activity || !userInput.date || !userInput.time) {
  console.error(exitReasons.noRequiredParameters.message);
  program.help();
  process.exit(exitReasons.noRequiredParameters.id);
}

module.exports = {
  userInput: program
}
