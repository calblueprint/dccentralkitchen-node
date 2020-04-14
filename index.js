import cors from 'cors';
import dotenv from 'dotenv-safe';
import express from 'express';
import { updateStoreProducts } from './utils/storeProducts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Allow Cross-Origin Requests
app.use(express.json()); // Format post body using JSON

// GET route as a sanity check when deploying
app.get('/', (_, res) => {
  res.send(
    "You've reached DC Central Kitchen's Backend Server. Try sending a request to one of the API endpoints!"
  );
});

// GET route to trigger the CSV parsing for store-products mapping update
app.get('/parse', async (_, res) => {
  try {
    const storeData = await updateStoreProducts();
    res.send({ data: storeData });
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
