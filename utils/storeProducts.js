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
import { getCurrentStoreProducts } from './googleSheets';

export const updateStoreProductsDev = async (oAuth2Client) => {
  const parsedData = await getCurrentStoreProducts(oAuth2Client);
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
  console.log('\nStores Missing in Airtable [DEV]: ', missingStores);

  missingProducts.sort();
  console.log('\nProducts Missing in Airtable [DEV]: ', missingProducts);

  await updateManyDevStores(noDeliveryStores);
  await updateManyDevStores(updatedStores);

  return { updatedStoreNames, noDeliveryStoreNames };
};

export const updateStoreProductsProd = async (oAuth2Client) => {
  const parsedData = await getCurrentStoreProducts(oAuth2Client);
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
