import cors from 'cors';
import dotenv from 'dotenv-safe';
import express from 'express';
import { google } from 'googleapis';
import {
  getCurrentStoreProducts,
  listTestData,
  updateDateRange,
} from './utils/googleSheets';
import { updateStoreProducts } from './utils/storeProducts';
import { synchDevProd } from './utils/synchDevProd';

dotenv.config({ allowEmptyValues: true });

/* --- Server --- */
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); // Allow Cross-Origin Requests
app.use(express.json()); // Format post body using JSON

/* --- Google OAuth Client --- */
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

oAuth2Client.on('tokens', (tokens) => {
  const combined = { ...tokens, refresh_token: process.env.REFRESH_TOKEN };
  oAuth2Client.setCredentials(combined);
});

// GET route as a sanity check when deploying
app.get('/', (_, res) => {
  res.send(
    "You've reached Healthy Corners Rewards's Backend Server. Try sending a request to one of the API endpoints!"
  );
});

/* --- Google Authorization --- */

// Uses cached tokens
/**
 * Relies on `refresh_token` being stored in `process.env`.
 * 5.1.2020 using anniero@berkeley.edu's tokens for access. If these permissions ever get revoked, we will have to update this!
 * If `refresh_token` doesn't exist, you MUST go to `auth-initial`!
 */
app.get('/auth', async (_, res) => {
  oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
  const { result, success } = await listTestData(oAuth2Client);
  if (success) {
    res.send(`<h1>Authorized!</h1>
    <h2>App is ready to use. Try making some API calls to the endpoints via browser or Postman.</h2>
    <p>Result of loading test data: ${result}</p>`);
  } else {
    res.send(`<h1>Not authorized</h1>
    <p>Please go to /auth-initial to authorize this app. Next, save your 'refresh_token' value and set it as the env variable REFRESH_TOKEN.</p>`);
  }
});

// This route must be used to collect refresh_token. Note that the app must be re-deployed after env configs are updated.
app.get('/auth-initial', async (_, res) => {
  // Ask user to authorize
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    scope: SCOPES,
  });
  res.send(`<h1>Authorization required</h1>
      <p><a href='${authUrl}'>Authorize this app</a></p>`);
});

app.get('/auth-callback', async (req, res) => {
  const { code } = req.query;
  let success = false;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    success = true;
    const { result } = await listTestData(oAuth2Client);
    res.send(`<h1>Successfully authorized!</h1>
      <h2>Copy the refresh token to your clipboard to update the env config: ${tokens.refresh_token}</h2>
      <p>Note that the refresh token is only returned on the first response when permissions are given. To revoke permissions, please remove access at https://myaccount.google.com/permissions. Then try again.</p>
      <p>Result of loading test data: <br> ${result}</p>`);
  } catch (err) {
    res.send({
      success,
      error: 'Google API error',
      message: `Error while trying to retrieve access token: ${err}`,
    });
  }
});

/* --- Update Store-Products Mapping --- */

// GET route to sanity-check parsing using Google sheets
app.get('/getMappings/current', async (_, res) => {
  const storeData = await getCurrentStoreProducts(oAuth2Client);
  res.send(storeData);
});

// POST route to update the spreadsheet using Google sheets
// NOTE: This does not necessarily need to be a public-facing API endpoint, but it's nice to sanity-check Google sheets access without touching Airtable
app.post('/updateDateRange', async (req, res) => {
  // Secure this route
  const secretKey = req.body.key;
  if (secretKey !== process.env.HC_SECRET) {
    res.send(`<h1>Error: usage of this API requires a secret key</h1>
    <p>Please notify someone to help you get access.</p>`);
    return;
  }

  await updateDateRange(oAuth2Client);
  res.send('<h1>ok</h1>');
});

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
    } = await updateStoreProducts(oAuth2Client, 'PROD');
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
    } = await updateStoreProducts(oAuth2Client, 'DEV');
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

app.listen(port, () =>
  console.log(`Healthy Corners Rewards - Backend listening on port ${port}!`)
);
