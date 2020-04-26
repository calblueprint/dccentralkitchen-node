/* eslint-disable no-param-reassign */
import {
  getAllProducts as getAllProdProducts,
  getAllStores as getAllProdStores,
  updateManyStores as updateManyProdStores,
} from '../lib/airtable-prod/request';
import {
  getAllProducts as getAllDevProducts,
  getAllStores as getAllDevStores,
  updateManyStores as updateManyDevStores,
} from '../lib/airtable/request';

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

export const updateStoreProductsDev = async () => {
  const filename = '2020mar30-apr17.csv';
  const parsedData = await parseCsv(filename);
  const currentStores = await getAllDevStores();
  const currentProducts = await getAllDevProducts();
  const missingStores = [];
  const missingProducts = [];

  const updatedStores = [];
  // Track to easily find which stores have not had a delivery
  const updatedStoreNames = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const storeData of parsedData) {
    const { name, products } = storeData;
    const store = currentStores.find((record) => record.storeName === name);
    if (!store) {
      console.log('Store not found in Airtable '.concat(name));
      missingStores.push(name);
      // eslint-disable-next-line no-continue
      continue;
    } else {
      const productIds = currentProducts
        .filter((record) => products.includes(record.fullName))
        .map((record) => record.id);

      updatedStores.push({
        id: store.id,
        fields: { productIds },
      });

      // The CSV only contains stores that were delivered to recently
      updatedStoreNames.push(name);

      // Check if products or missing or incorrectly formatted
      const storeMissingProducts = products.filter(
        (fullName) =>
          !currentProducts.find((record) => record.fullName === fullName)
      );
      storeMissingProducts.forEach((missing) => {
        if (missingProducts.indexOf(missing) === -1)
          missingProducts.push(missing);
      });
    }
  }

  // Track names for logging purposes
  const noDeliveryStoreNames = [];
  // Find which stores in the [DEV] base have not had deliveries
  const noDeliveryStores = currentStores
    .filter(
      (currentStore) =>
        !updatedStoreNames.find((name) => name === currentStore.storeName)
    )
    .map((noDeliveryStore) => {
      noDeliveryStoreNames.push(noDeliveryStore.storeName);
      return {
        id: noDeliveryStore.id,
        fields: { productIds: [] },
      };
    });

  // Useful logging
  console.log('\n\n');
  console.log('\nStores with deliveries this cycle: ', updatedStoreNames);
  console.log('\nStores with no deliveries this cycle: ', noDeliveryStoreNames);

  missingStores.sort();
  console.log('\nStores Missing in Airtable [PROD]: ', missingStores);

  missingProducts.sort();
  console.log('\nProducts Missing in Airtable [PROD]: ', missingProducts);

  await updateManyDevStores(noDeliveryStores);
  await updateManyDevStores(updatedStores);

  return { updatedStoreNames, noDeliveryStoreNames };
};

export const updateStoreProductsProd = async () => {
  const filename = '2020apr9-apr20.csv';
  const parsedData = await parseCsv(filename);
  const currentStores = await getAllProdStores();
  const currentProducts = await getAllProdProducts();
  const missingStores = [];
  const missingProducts = [];

  const updatedStores = [];
  // Track to easily find which stores have not had a delivery
  const updatedStoreNames = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const storeData of parsedData) {
    const { name, products } = storeData;
    const store = currentStores.find((record) => record.storeName === name);
    if (!store) {
      console.log('Store not found in Airtable '.concat(name));
      missingStores.push(name);
      // eslint-disable-next-line no-continue
      continue;
    } else {
      const productIds = currentProducts
        .filter((record) => products.includes(record.fullName))
        .map((record) => record.id);

      updatedStores.push({
        id: store.id,
        fields: { productIds },
      });

      // The CSV only contains stores that were delivered to recently
      updatedStoreNames.push(name);

      // Check if products or missing or incorrectly formatted
      const storeMissingProducts = products.filter(
        (fullName) =>
          !currentProducts.find((record) => record.fullName === fullName)
      );
      storeMissingProducts.forEach((missing) => {
        if (missingProducts.indexOf(missing) === -1)
          missingProducts.push(missing);
      });
    }
  }

  // Track names for logging purposes
  const noDeliveryStoreNames = [];
  // Find which stores in the [PROD] base have not had deliveries
  const noDeliveryStores = currentStores
    .filter(
      (currentStore) =>
        !updatedStoreNames.find((name) => name === currentStore.storeName)
    )
    .map((noDeliveryStore) => {
      noDeliveryStoreNames.push(noDeliveryStore.storeName);
      return {
        id: noDeliveryStore.id,
        fields: { productIds: [] },
      };
    });

  // Useful logging
  console.log('\n\n');
  console.log('\nStores with deliveries this cycle: ', updatedStoreNames);
  console.log('\nStores with no deliveries this cycle: ', noDeliveryStoreNames);

  missingStores.sort();
  console.log('\nStores Missing in Airtable [PROD]: ', missingStores);

  missingProducts.sort();
  console.log('\nProducts Missing in Airtable [PROD]: ', missingProducts);

  await updateManyProdStores(noDeliveryStores);
  await updateManyProdStores(updatedStores);

  return { updatedStoreNames, noDeliveryStoreNames };
};
