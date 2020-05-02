// Original implementation (manually download a CSV and run the server, triggering endpoint to parse and update Airtable)

/*
 * UNUSED. See googleSheets.js for the newest implementation
 */
const csv = require('csv-parser');
const fs = require('fs');

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

// Input from FY20 Sales Data, 'Blueprint - Store Products' sheet
const parseCsv = async (filename) => {
  const storeData = [];

  const src = fs.createReadStream(filename);
  const end = new Promise(function process(resolve, _) {
    src
      .pipe(csv({ headers: false, skipLines: 2 }))
      .on('data', (row) => {
        const store = { name: null, products: [], deliveryDate: null };
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(row)) {
          if (key === '0' && value === 'Grand Total') {
            // eslint-disable-next-line no-continue
            continue;
          }

          // Store Name
          else if (key === '0') {
            // Special handling for poorly-formatted:
            if (value in formatStores) {
              store.name = formatStores[value];
            } else store.name = value;
            // Latest delivery date
          } else if (key === '1') {
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
        }
        storeData.push(store);
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        resolve(storeData);
      });
  });
  return end;
};

export default parseCsv;
