// Scheduled job configured with Heroku Scheduler
// Relies on cached refresh token stored in `.env`
import dotenv from 'dotenv-safe';
import moment from 'moment';
import { updateStoreProducts } from './utils/storeProducts';

dotenv.config();

// Can't use top-level await yet, so .then.catch it
updateStoreProducts('PROD')
  .then((result) => {
    console.log({
      updateDate: moment().format(),
      message: 'Succesfully updated Store Products through Appian API',
    });
  })
  .catch((e) => {
    console.error(e);
  });
