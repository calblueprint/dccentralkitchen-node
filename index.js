import cors from 'cors';
import dotenv from 'dotenv-safe';
import express from 'express';
import fs from 'fs';
import { google } from 'googleapis';
import { listTestData } from './utils/googleSheets';
import {
  updateStoreProductsDev,
  updateStoreProductsProd,
} from './utils/storeProducts';
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

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// GET route as a sanity check when deploying
app.get('/', (_, res) => {
  res.send(
    "You've reached DC Central Kitchen's Backend Server. Try sending a request to one of the API endpoints!"
  );
});

app.get('/auth', async (_, res) => {
  let success = false;
  // Check if we have previously written a token to disk.
  fs.readFile(TOKEN_PATH, async (err, token) => {
    // Ask user to authorize
    if (err) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      res.send(`<h1>Authorization required</h1>
      <p><a href='${authUrl}'>Authorize this app</a></p>`);
    } else {
      // Otherwise, load test data
      oAuth2Client.setCredentials(JSON.parse(token));
      success = true;
      const result = await listTestData(oAuth2Client);
      res.send(`<h2>Already authorized!</h2>
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
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (e) => {
      if (e) console.error(e);
      else console.log('Token stored to', TOKEN_PATH);
    });
  } catch (err) {
    res.send({
      success,
      error: 'Google API error',
      message: `Error while trying to retrieve access token: ${err}`,
    });
  }
  // res.redirect('/');
});
// GET route to trigger the CSV parsing for store-products mapping update (PROD)
app.get('/updateStoreProductsProd', async (_, res) => {
  try {
    const {
      updatedStoreNames,
      noDeliveryStoreNames,
    } = await updateStoreProductsProd();
    res.send({ updatedStoreNames, noDeliveryStoreNames });
  } catch (e) {
    console.error(e);
  }
});

// GET route to trigger the CSV parsing for store-products mapping update (DEV)
app.get('/updateStoreProductsDev', async (_, res) => {
  try {
    const {
      updatedStoreNames,
      noDeliveryStoreNames,
    } = await updateStoreProductsDev();
    res.send({ updatedStoreNames, noDeliveryStoreNames });
  } catch (e) {
    console.error(e);
  }
});

// GET route to trigger the CSV parsing for store-products mapping update
app.get('/synch', async (_, res) => {
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

// Leaving a few examples of people power's api routes!
app.post('/invite', async (req, res) => {
  // I excessively log on backend apps because it's much more relevant
  console.log('Received Invite Request with body:');
  console.log(req.body);

  // const confirmSend =  await sendInviteEmail(req.body.pledgeInviteId);
  const confirmSend = 'dummy';

  if (confirmSend === '') {
    res.send({
      status: `An error occured when sending an invitation.`,
    });
  }

  res.send({
    status: `Successfully sent an invitation to ${confirmSend}`,
  });
});

app.get('/approve', async (req, res) => {
  console.log('Received Approve Request with query:');
  console.log(req.query);

  const billId = req.query.id;
  try {
    // await approveSubscriberBill(billId);
    res.send('Subscriber Bill Approved!');
  } catch (e) {
    console.log(e);
    console.log('Request Approval Failed.');
    res
      .status(400)
      .send(
        'Request Approval Failed, likely due to malformed request or nonexistent subscriber ID.'
      );
  }
});

app.listen(port, () =>
  console.log(`DC Central Backend listening on port ${port}!`)
);
