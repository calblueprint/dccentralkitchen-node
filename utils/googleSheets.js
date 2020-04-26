/* eslint-disable import/prefer-default-export */
import { google } from 'googleapis';

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
      // Skip the two header rows
      if (rowNum < 2) {
        return;
      }
      const store = { name: null, products: [], deliveryDate: null };
      // Each row contains information for one store
      row.forEach((value, ind) => {
        if (ind === 0 && value === 'Grand Total') {
          console.log('Skip processing');
        }

        // Store Name
        else if (ind === 0) {
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
