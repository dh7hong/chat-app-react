const moment = require("moment");

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format("MM/DD/YY, hh:mm A"),
  };
}


module.exports = formatMessage;
