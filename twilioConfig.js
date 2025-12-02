const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN);
const service = process.env.TWILIO_SERVICE_SID;
module.exports = {client,service};
