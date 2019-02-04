# Platinium activities reserver

Tool for automatic activity booking


## Usage

```
$ node app.js

Pass all required parameters
Usage: app [options]

Options:
  -V, --version              output the version number
  -u, --username <username>  username (email)
  -p, --password <password>  password
  -a, --activity <activity>  activity name e.g 'squash' or 'Kort 1 - Rezerwacja Squash'
  -d, --date <date>          date in DD-MM-YYYY format, e.g 15-01-2019
  -t, --time <time>          time in HH:MM format, e.g 19:30
  -h, --help                 output usage information
```

Run with activity parameter **'squash'**, will reserve two activities, because platinium API returns two courts:
```
POST 'Classes/ClassCalendar/WeeklyListClasses' body: { clubId: 16, search: 'squash'} => 
'Kort 1 - Rezerwacja Squash'
'Kort 2 - Rezerwacja Squash'
```
If you want to reserve one activity, pass e.g **'Kort 1 - Rezerwacja Squash'** as activity parameter.

## Run example 
```
$ node app.js -u email@address.com -p Dupa8 -d 22-01-2019 -t 9:30 -a squash
```
