/* eslint-disable import/prefer-default-export */
import moment from 'moment';
import saveFile from '../lib/saveFile';
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
import getProducts from './appian';

// Update the store-products linked records mapping in Airtable
export const updateStoreProducts = async (base = 'DEV') => {
  const parsedData = await getProducts();

  let currentStores = [];
  let currentProducts = [];

  // base must be one of these
  if (base === 'DEV') {
    currentStores = await getAllDevStores();
    currentProducts = await getAllDevProducts();
  } else if (base === 'PROD') {
    currentStores = await getAllProdStores();
    currentProducts = await getAllProdProducts();
  } else {
    console.log(
      "Error: please check the inputted value for the 'base' parameter"
    );
  }
  saveFile('./data/currentProducts.json', currentProducts);
  const missingStores = [];
  const missingProducts = [];

  const updatedStores = [];
  // Track to easily find which stores have not had a delivery
  const updatedStoreNames = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const storeData of parsedData) {
    const { storeName, products, lastDeliveryDate } = storeData;
    const store = currentStores.find(
      (record) => record.storeName === storeName
    );
    if (!store) {
      console.log('Store not found in Airtable '.concat(storeName));
      missingStores.push(storeName);
      // eslint-disable-next-line no-continue
      continue;
    } else {
      const productIds = currentProducts
        .filter((record) => products.includes(record.fullName))
        .map((record) => record.id);
      updatedStores.push({
        id: store.id,
        fields: { productIds, latestDelivery: lastDeliveryDate },
      });
      // The response only contains stores that were delivered to recently
      updatedStoreNames.push(storeName);

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

  // Temporarily track start/end range to keep old products for Appian transition
  const startDate = moment().subtract(9, 'days');
  const endDate = moment();

  // Find which stores in the base have not had deliveries
  const noDeliveryStores = currentStores
    .filter(
      (currentStore) =>
        !updatedStoreNames.find((name) => name === currentStore.storeName)
    )
    .map((noDeliveryStore) => {
      noDeliveryStoreNames.push(noDeliveryStore.storeName);
      // Temporarily (only until transition is complete) keep products that have delivery dates within last 9 days for cutover
      if (
        moment(noDeliveryStore.latestDelivery).isBetween(startDate, endDate)
      ) {
        console.log(
          'Keeping products for ',
          noDeliveryStore.storeName,
          ' since ',
          noDeliveryStore.latestDelivery,
          ' is within last 9 days'
        );
        return {
          id: noDeliveryStore.id,
          fields: {},
        };
      }
      return {
        id: noDeliveryStore.id,
        fields: { productIds: [] },
      };
    });

  // Useful logging
  console.log('\n');
  console.log('\nStores with deliveries this cycle:', updatedStoreNames);
  console.log('\nStores with no deliveries this cycle:', noDeliveryStoreNames);

  missingStores.sort();
  console.log(`\nStores Missing in Airtable [${base}]:`, missingStores);
  saveFile('./data/missingStores.json', missingStores);
  missingProducts.sort();
  console.log(`\nProducts Missing in Airtable [${base}]:`, missingProducts);

  saveFile('./data/missingProducts.json', missingProducts);

  // Update Airtable base
  if (base === 'DEV') {
    await updateManyDevStores(noDeliveryStores);
    await updateManyDevStores(updatedStores);
  } else if (base === 'PROD') {
    await updateManyProdStores(noDeliveryStores);
    await updateManyProdStores(updatedStores);
  }

  return {
    updatedStoreNames,
    noDeliveryStoreNames,
    missingStores,
    missingProducts,
  };
};
