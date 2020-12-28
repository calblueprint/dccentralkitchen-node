import moment from 'moment';
import getCustomers from './customerUtils';
import sendSms from './twilioClient';

function formatMessage(name, favoriteStores) {
  // Construct the string based on how many stores are included
  let storeString = '';
  if (favoriteStores.length === 1) {
    storeString = favoriteStores;
  } else if (favoriteStores.length === 2) {
    storeString = favoriteStores.join(' and ');
  } else {
    const lastStore = favoriteStores.pop();
    storeString = `${favoriteStores.join(', ')}, and ${lastStore}`;
  }

  return `Healthy Corners: Hi ${name}, your favorite store(s) (${storeString}) received fresh deliveries from Healthy Corners today! Visit the Healthy Corners app healthycorners.app.link/newdelivery to see which products were delivered. Reply STOP to unsubscribe.`;
}

export default async function notifyCustomers(base = 'DEV') {
  console.log('Starting at ', moment().format());

  // Retrieve filtered customer data from Airtable
  const customers = (await getCustomers(base)).filter(
    (customer) => customer.favoriteStores.length > 0
  );
  if (customers.length > 0) {
    console.log('Sending alerts to: ', customers);
  } else {
    console.log('No customers to alert.');
  }

  // Construct and send formatted messages for each customer
  customers.forEach((customer) => {
    const messageToSend = formatMessage(customer.name, customer.favoriteStores);
    sendSms(customer.phoneNumber, messageToSend);
  });
  return customers.length;
}
