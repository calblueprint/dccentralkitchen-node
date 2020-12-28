import cors from 'cors';
import dotenv from 'dotenv-safe';
import express from 'express';
import { updateStoreProducts } from './utils/storeProducts';
import { synchDevProd } from './utils/synchDevProd';
import sendSms from './utils/twilioClient';
import notifyCustomers from './utils/twilioNotifications';

dotenv.config({ allowEmptyValues: true });

/* --- Server --- */
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); // Allow Cross-Origin Requests
app.use(express.json()); // Format post body using JSON

// GET route as a sanity check when deploying
app.get('/', (_, res) => {
  res.send(
    "You've reached Healthy Corners Rewards's Backend Server. Try sending a request to one of the API endpoints!"
  );
});

/* --- Update Store-Products Mapping --- */

// POST route to update the Airtable store-products linked records mapping (PROD)
app.post('/updateMappings/prod', async (req, res) => {
  // Secure this route
  const secretKey = req.body.key;
  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }

  try {
    const {
      updatedStoreNames,
      noDeliveryStoreNames,
      missingProducts,
      missingStores,
    } = await updateStoreProducts('PROD');
    res.send({
      updatedStoreNames,
      noDeliveryStoreNames,
      missingProducts,
      missingStores,
    });
  } catch (e) {
    console.error(e);
  }
});

// POST route to trigger the CSV parsing for store-products mapping update (DEV)
app.post('/updateMappings/dev', async (req, res) => {
  // Secure this route
  const secretKey = req.body.key;
  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }

  try {
    const {
      updatedStoreNames,
      noDeliveryStoreNames,
      missingProducts,
      missingStores,
    } = await updateStoreProducts('DEV');
    res.send({
      updatedStoreNames,
      noDeliveryStoreNames,
      missingProducts,
      missingStores,
    });
  } catch (e) {
    console.error(e);
  }
});

/* Port data from [DEV] base to [PROD] base */

// Useful if you want to update data in the DEV base first, then update all of PROD at once
// Will likely remain unused post-handoff

// GET route to trigger a synchronization of store & product details from the [DEV] base to the [PROD] base
app.post('/synch', async (req, res) => {
  // Secure this route
  const secretKey = req.body.key;
  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }

  try {
    const {
      newIds,
      updatedProductNames,
      updatedProductIds,
      updatedStoreNames,
      updatedStoreIds,
    } = await synchDevProd();
    res.send({
      newIds,
      updatedProductNames,
      updatedProductIds,
      updatedStoreNames,
      updatedStoreIds,
    });
  } catch (e) {
    console.error(e);
  }
});

/* --- Twilio SMS --- */

// POST route to send product delivery alerts for customers in PROD
app.post('/send_alert', async (req, res) => {
  const secretKey = req.body.key;

  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }
  try {
    const customers = await notifyCustomers('PROD');
    res.send(`Success! Delivery alerts were sent to ${customers} customer(s).`);
  } catch (err) {
    console.error(err);
    res.send(`<h1>Error</h1>
    <p>${err}</p>`);
  }
});

// POST route to send product delivery alerts for customers in DEV
app.post('/send_alert/dev', async (req, res) => {
  const secretKey = req.body.key;

  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }
  try {
    const customers = await notifyCustomers('DEV');
    res.send(`Success! Delivery alerts were sent to ${customers} customer(s).`);
  } catch (err) {
    console.error(err);
    res.send(`<h1>Error</h1>
    <p>${err}</p>`);
  }
});

// POST route to send a custom SMS to a phone number (used when enabling notifications)
app.post('/send_sms', async (req, res) => {
  const { to, message, key } = req.body;

  if (key !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }
  try {
    sendSms(to, message);
    res.send(`Success! Your message '${message}' was sent to ${to}`);
  } catch (err) {
    console.error(err);
    res.send(`<h1>Error</h1>
    <p>${err}</p>`);
  }
});

// POST route to send a custom SMS to a batch of phone numbers
app.post('/send_sms_batch', async (req, res) => {
  const { to, message, key } = req.body;

  if (key !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }
  try {
    to.forEach((recipient) => sendSms(recipient, message));
    res.send(`Success! '${message}' was sent to ${to.join(', ')}`);
  } catch (err) {
    console.error(err);
    res.send(`<h1>Error</h1>
    <p>${err}</p>`);
  }
});

app.listen(port, () =>
  console.log(`Healthy Corners Rewards - Backend listening on port ${port}!`)
);
