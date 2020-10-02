import dotenv from 'dotenv-safe';
import fetch from 'node-fetch';

// These two objects hold mappings to correct discrepancies between what's in our Airtable as Store / Product 'Name' properties.
dotenv.config({ allowEmptyValues: true });
const formatStores = {
  'Nams Market': "Nam's Market",
  'Ken Mart Inc': 'Ken Mart',
};

const formatProducts = {
  'Grapes, Red seedless, Fresh Cut': 'Grapes, Red (6 oz)',
  'Grapes, Green seedless, Fresh Cut': 'Grapes, Green (6 oz)',
  'tomato, cherry': 'Tomato, Cherry (6 oz)',
  'Cherry Tomato': 'Tomato, Cherry (6 oz)',
  'Grapes, Mix seedless, Fresh Cut': 'Grapes, Mix (6 oz)',
  'Collard Greens (bunch)': 'Collard Greens, (bunch)',
  'Garlic, peeled (bag)': 'Garlic, Peeled (bag)',
  'Clementines (bag)': 'Clementines, (bag)',
  'Collard Greens, Bag': 'Collard Greens, (bag)',
  'Corn, Frozen Vegetables': 'Corn, Frozen',
  'Butterhead Lettuce': 'Lettuce, Butterhead',
  'Lettuce, Butterhead (clamshell)': 'Lettuce, Butterhead',
  'Spring Mix,Organic': 'Spring Mix, Organic',
  'Kale (bunch)': 'Kale, (bunch)',
  'Kale (Bunch)': 'Kale, (bunch)',
  'Spinach, Frozen Vegetables': 'Spinach, Frozen',
  'Frozen Spinach': 'Spinach, Frozen',
  'Peas, Frozen Vegetables': 'Peas, Frozen',
  'Frozen Peas': 'Peas, Frozen',
  'Frozen Corn': 'Corn, Frozen',

  'Cucumber, Persian lb': 'Cucumber, Persian',
  'Apple, Golden Delicious (local)': 'Apple, Golden Delicious',
  'Clementines, bag': 'Clementines, (bag)',
  'Watermelon (whole)': 'Watermelon, (whole)',
  'Spring Mix, Bowery Farm BOGO': 'Spring Mix, Bowery Farm',
  'Baby Kale, Bowery Farm BOGO': 'Kale, Bowery Farm',
  'Romaine Lettuce, Bowery Farm BOGO': 'Lettuce, Romaine Bowery Farm',
  'Butter head lettuce, Bowery Farm': 'Lettuce, Butterhead Bowery Farm',
};

/**
 * Parse the 'Blueprint - Store Products' sheet of 'FY20 Sales Data and Trends'
 * @see https://docs.google.com/spreadsheets/d/1r-_OB7IsU_CxTNprUXUtgLVON7f-3BSxBXVRLhvB71U/edit#gid=1205390067
 * @see parseCsv.js for the original implementation
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
export default async function getProducts() {
  const storeData = [];
  try {
    const response = await fetch(
      'https://dcck-dev.appiancloud.com/suite/webapi/recent-order-data',
      {
        method: 'GET',
        headers: {
          'Appian-Api-Key': process.env.APPIAN_API_KEY,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    const { data } = await response.json();
    data.forEach((record) => {
      const store = { storeName: null, products: [], lastDeliveryDate: null };
      if (record.storeName in formatStores) {
        store.storeName = formatStores[record.storeName];
      } else store.storeName = record.storeName;
      store.lastDeliveryDate = record.lastDeliveryDate;
      record.products.forEach((product) => {
        if (product in formatProducts) {
          store.products.push(formatProducts[product]);
        } else store.products.push(product);
      });
      storeData.push(store);
    });
  } catch (err) {
    console.log(err);
    return null;
  }
  return storeData;
}
