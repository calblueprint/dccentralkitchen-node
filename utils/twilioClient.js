import twilio from 'twilio';
import config from '../twilioConfig';

export default async function sendSms(to, message) {
  const client = twilio(config.accountSid, config.authToken);
  return client.api.messages
    .create({
      body: message,
      to,
      from: config.sendingNumber,
    })
    .then((data) => {
      console.log(`Successfully notified ${data.to}`);
    })
    .catch((err) => {
      console.error(`[ERROR] Could not notify ${to}`);
      console.error(err);
    });
}
