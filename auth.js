const axios = require('axios');

const {platiniumBaseUrl, actions, exitReasons} = require("./constants.js");
const {exitProgram} = require("./utils.js");

//Needed headers
axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/72.0.3617.0 Safari/537.36';
axios.defaults.withCredentials = true;

async function loginAndSetCookie(username, password) {
  return axios({
    method: `post`,
    url: `${platiniumBaseUrl}${actions.login}`,
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
    exitProgram(exitReasons.incorrectCredentials, false);
  })
}


module.exports = {
  loginAndSetCookie
}
