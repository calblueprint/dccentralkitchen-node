import twilio from 'twilio';
import config from '../twilioConfig';

/**
 * Send an SMS message using the configured Twilio client from twilioConfig
 * @see https://github.com/TwilioDevEd/server-notifications-node
 * @see https://www.twilio.com/docs/sms/tutorials/server-notifications-node-express
 * @param {string} to recipient phone number (formatted)
 * @param {string} message
 */
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
