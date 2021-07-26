const axios = require('axios');
const constants = require('./constants');

//Needed headers
axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/72.0.3617.0 Safari/537.36';
axios.defaults.withCredentials = true;

const loginAndSetCookie = (username, password) => axios({
  method: `post`,
  url: `${constants.platiniumBaseUrl}${constants.actions.login}`,
  withCredentials: true,
  headers: {
    cookie: 'ClientPortal.Embed;'
  },
  data: {
    Login: username,
    Password: password,
    RememberMe: true
  }
}).then(result => {
  axios.defaults.headers.cookie = `ClientPortal.Embed; ${result.headers['set-cookie'][0].split(';')[0]}`
}).catch(() => {
  console.error('Incorrect username / password or server error.');
  process.exit(constants.exitCodes.incorrectCredentials);
});


module.exports = {
  loginAndSetCookie
}
