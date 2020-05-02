// Scheduled job configured with Heroku Scheduler
// Relies on cached refresh token stored in `.env`
import dotenv from 'dotenv-safe';
import { google } from 'googleapis';
import moment from 'moment';
import { updateStoreProducts } from './utils/storeProducts';

dotenv.config();

// --- Google
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.on('tokens', (tokens) => {
  const combined = { ...tokens, refresh_token: process.env.REFRESH_TOKEN };
  oAuth2Client.setCredentials(combined);
});

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Can't use top-level await yet, so .then.catch it
updateStoreProducts(oAuth2Client, 'PROD')
  .then((result) => {
    console.log({
      updateDate: moment().format(),
      message: 'Succesfully updated Store Products',
    });
  })
  .catch((e) => {
    console.error(e);
  });
