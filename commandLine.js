const program = require("commander");
const moment = require("moment");

const {
  exitReasons,
  timeFormatUserPattern, dayWithTimeDateFormat, currentDateTime
} = require("./constants");

const userInput = program
  .version('0.0.7')
  .option('-u, --username <username>', 'username (email)')
  .option('-p, --password <password>', 'password')
  .option('-a, --activity <activity>', `activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'`)
  .option('-d, --date <date> ', 'date in DD-MM-YYYY format, e.g 15-01-2019', (dateParameter) => moment(dateParameter, 'DD-MM-YYYY').startOf('day'))
  .option('-t, --time <time> ', 'time in HH:MM format, e.g 19:30', (time) => {
    const timeFormatPattern = new RegExp(timeFormatUserPattern);
    if (!timeFormatPattern.test(time)) {
      throw 'Wrong time format! Please type time with HH:MM format e.g: 09:30, 20:00.'
    }
    const parsedTime = time.match(timeFormatPattern);
    return {
      hour: parsedTime[1],
      minute: parsedTime[2]
    };
  })
  .parse(process.argv)
  .on('command:*', () => {
    //TODO: extract into formatter function
    console.error('Invalid parameter: %s\nSee --help for a list of available parameters.', program.args.join(' '));
    process.exit(exitReasons.invalidParameter.id);
  });

console.log(`
Current date    : ${currentDateTime.format(dayWithTimeDateFormat)}
Wanted date     : ${userInput.date.format(dayWithTimeDateFormat)} //TODO Fix time
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
