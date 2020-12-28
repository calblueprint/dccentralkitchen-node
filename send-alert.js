// Scheduled job to send delivery alerts configured with Heroku Scheduler
import moment from 'moment';
import notifyCustomers from './utils/twilioNotifications';

// Can't use top-level await yet, so .then.catch it
notifyCustomers('PROD')
  .then((result) => {
    console.log({
      updateDate: moment().format(),
      message: `Succesfully notified ${result} customers`,
    });
  })
  .catch((e) => {
    console.error(e);
  });
