/* eslint-disable import/prefer-default-export */
import fs from 'fs';
import { google } from 'googleapis';
import moment from 'moment';

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
export const TOKEN_PATH = 'token.json';

export function saveTokens(oAuth2Client, tokens) {
  if (tokens.refresh_token) {
    const refreshPath = 'refresh_'.concat(TOKEN_PATH);
    // Store the token to disk for later program executions
    fs.writeFile(
      refreshPath,
      JSON.stringify({ refresh_token: tokens.refresh_token }),
      (e) => {
        if (e) console.error(e);
        else console.log('Refresh token stored to', refreshPath);
      }
    );
  }
  const accessPath = 'access_'.concat(TOKEN_PATH);
  fs.writeFile(
    accessPath,
    JSON.stringify({ access_token: tokens.access_token }),
    (e) => {
      if (e) console.error(e);
      else console.log('Access stored to', accessPath);
    }
  );
  oAuth2Client.setCredentials(tokens);
}

/**
 * Used for authorization sanity-check
 * Prints the contents of a test version of the sheet we care about (sheet is public to all users)
 * @see https://docs.google.com/spreadsheets/d/129BwSHKu-_qTMcpZKpqCp55qQWNipXft9tPOnqFkyB0/edit#gid=0
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
export async function listTestData(auth) {
  let result = '';
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: '129BwSHKu-_qTMcpZKpqCp55qQWNipXft9tPOnqFkyB0',
      range: 'Store-Products', // Read everything from the sheet
    });

    const rows = data.values;
    if (rows.length) {
      result = result.concat('<br>Store Name, First Product:<br>');
      // Print columns A and C, which correspond to indices 0 and 2.
      rows.forEach((row) => {
        result = result.concat(`<br>${row[0]}, ${row[2]}`);
      });
    } else {
      result = result.concat('No data found.');
    }
  } catch (err) {
    result = result.concat(`The API returned an error: ${err}`);
  }
  return result;
}

// These two objects hold mappings to correct discrepancies between what's in our Airtable as Store / Product 'Name' properties.

const formatStores = {
  'Nams Market': "Nam's Market",
  'Ken Mart Inc': 'Z-Mart',
};

const formatProducts = {
  'Grapes, Red seedless, Fresh Cut': 'Grapes, Red (6 oz)',
  'Grapes, Green seedless, Fresh Cut': 'Grapes, Green (6 oz)',
  'tomato, cherry': 'Tomato, Cherry (6 oz)',
  'Grapes, Mix seedless, Fresh Cut': 'Grapes, Mix (6 oz)',
  'Collard Greens (bunch)': 'Collard Greens, (bunch)',
  'Garlic, peeled (bag)': 'Garlic, Peeled (bag)',
  'Clementines (bag)': 'Clementines, (bag)',
  'Collard Greens, Bag': 'Collard Greens, (bag)',
  'Corn, Frozen Vegetables': 'Corn, Frozen',
  'Lettuce, Butterhead (clamshell)': 'Lettuce, Butterhead',
  'Spring Mix,Organic': 'Spring Mix, Organic',
  'Kale (bunch)': 'Kale, (bunch)',
  'Spinach, Frozen Vegetables': 'Spinach, Frozen',
  'Peas, Frozen Vegetables': 'Peas, Frozen',
};

/**
 * Parse the 'Blueprint - Store Products' sheet of 'FY20 Sales Data and Trends'
 * @see https://docs.google.com/spreadsheets/d/1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U/edit#gid=1205390067
 * @see parseCsv.js for the original implementation
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
export async function getCurrentStoreProducts(auth) {
  const storeData = [];
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: '1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U',
      range: 'Blueprint - Store Products', // Read everything from the sheet
    });

    const rows = data.values;

    rows.forEach((row, rowNum) => {
      // Skip the two header rows, or empty rows (denoted by empty Store Name field)
      if (rowNum < 2 || row.length === 0) {
        return;
      }
      const store = { name: null, products: [], deliveryDate: null };
      // Each row contains information for one store
      row.forEach((value, ind) => {
        // Store Name
        if (ind === 0) {
          // Special handling for poorly-formatted:
          if (value in formatStores) {
            store.name = formatStores[value];
          } else store.name = value;
          // Latest delivery date
        } else if (ind === 1) {
          store.deliveryDate = value;
          // All others are products
        } else if (value) {
          // Special handling for poorly-formatted:
          if (value in formatProducts) {
            store.products.push(formatProducts[value]);
          } else {
            store.products.push(value);
          }
        }
      });
      // One store per row
      storeData.push(store);
    });
  } catch (err) {
    console.error(`The API returned an error: ${err}`);
  }
  return storeData;
}

/**
 * Update the Date Range cells (G1, I1) used in formulas within 'Blueprint - Store Products' sheet of 'FY20 Sales Data and Trends'
 * @see https://docs.google.com/spreadsheets/d/1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U/edit#gid=1205390067
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
export async function updateDateRange(auth) {
  let success = false;
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // Date range length is configurable from spreadsheet, so we get it first
    // We only strictly need G1, but this makes formatting easier for the update
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: '1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U',
      range: 'Blueprint - Store Products!F1:L1',
    });
    // data.values is like '[ ['Date Range Length', '7', '', 'Date Range Start', '4/9/2020', 'Date Range End', '4/26/2020'] ]'
    // `values` will only ever have one row
    const dateConfig = data.values[0];
    const rangeLength = parseInt(dateConfig[1], 10);

    // Copy the input, omitting the range configuration cell
    const updatedConfig = dateConfig.slice(3);
    // The end date is always initialized to today, start date is relative to that
    const startDate = moment().subtract(rangeLength, 'days');
    const endDate = moment();
    updatedConfig[1] = startDate.format('M/D/YYYY');
    updatedConfig[3] = endDate.format('M/D/YYYY');

    // updatedConfig is like '['Date Range Start', '4/20/2020', 'Date Range End', '4/27/2020']'
    // We only strictly need to update J1 and L1, but this makes keeping formatting for the label cells easier
    // @ts-ignore
    await sheets.spreadsheets.values.update({
      spreadsheetId: '1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U',
      range: 'Blueprint - Store Products!I1:L1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [updatedConfig] },
    });
    success = true;
  } catch (err) {
    console.error(`The API returned an error: ${err}`);
  }
  return success;
}
