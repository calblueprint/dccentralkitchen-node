import cors from 'cors';
import dotenv from 'dotenv-safe';
import express from 'express';
import fs from 'fs';
import { google } from 'googleapis';
import {
  getCurrentStoreProducts,
  listTestData,
  saveTokens,
  TOKEN_PATH,
  updateDateRange,
} from './utils/googleSheets';
import { updateStoreProducts } from './utils/storeProducts';
import { synchDevProd } from './utils/synchDevProd';

dotenv.config();

// --- Server
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); // Allow Cross-Origin Requests
app.use(express.json()); // Format post body using JSON

// --- Google
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

oAuth2Client.on('tokens', (tokens) => {
  saveTokens(oAuth2Client, tokens);
});

// GET route as a sanity check when deploying
app.get('/', (_, res) => {
  res.send(
    "You've reached DC Central Kitchen's Backend Server. Try sending a request to one of the API endpoints!"
  );
});

// --- Google Authorization
app.get('/auth', async (_, res) => {
  // Check if we have previously written a token to disk.
  fs.readFile('access_'.concat(TOKEN_PATH), async (err, token) => {
    // Ask user to authorize
    if (err) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Required to get a refresh token
        scope: SCOPES,
      });
      res.send(`<h1>Authorization required</h1>
      <p><a href='${authUrl}'>Authorize this app</a></p>`);
    } else {
      // Otherwise, set token and load test data
      oAuth2Client.setCredentials(JSON.parse(token));
      const result = await listTestData(oAuth2Client);
      res.send(`<h1>Authorized!</h1>
      <h2>App is ready to use. Try making some API calls to the endpoints via browser or Postman.</h2>
      <p>Result of loading test data: ${result}</p>`);
    }
  });
  await listTestData(oAuth2Client);
});

app.get('/auth-callback', async (req, res) => {
  const { code } = req.query;
  let success = false;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    success = true;
    const result = await listTestData(oAuth2Client);
    res.send(`<h1>Successfully authorized!</h1>
      <p>Result of loading test data: <br> ${result}</p>`);
  } catch (err) {
    res.send({
      success,
      error: 'Google API error',
      message: `Error while trying to retrieve access token: ${err}`,
    });
  }
});

// --- Update Store-Products Mapping

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
    } = await updateStoreProducts(oAuth2Client, 'PROD');
    res.send({ updatedStoreNames, noDeliveryStoreNames });
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
    } = await updateStoreProducts(oAuth2Client, 'DEV');
    res.send({ updatedStoreNames, noDeliveryStoreNames });
  } catch (e) {
    console.error(e);
  }
});

// --- Port data from [DEV] base to [PROD] base

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
  console.log(`DC Central Backend listening on port ${port}!`)
);
