/* eslint-disable no-param-reassign */
import {
  createManyProducts,
  createManyStores,
  getAllProducts as getAllProdProducts,
  getAllStores as getAllProdStores,
  updateManyProducts as updateManyProdProducts,
  updateManyStores as updateManyProdStores,
} from '../lib/airtable-prod/request';
import {
  getAllProducts as getAllDevProducts,
  getAllStores as getAllDevStores,
} from '../lib/airtable/request';

const csv = require('csv-parser');
const fs = require('fs');

const parseCsv = async () => {
  const storeData = [];
  const filename = 'storeproducts_2020apr2-12.csv';
  const src = fs.createReadStream(filename);
  const end = new Promise(function process(resolve, _) {
    src
      .pipe(csv({ headers: false, skipLines: 1 }))
      .on('data', row => {
        const store = { name: null, products: [] };
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of Object.entries(row)) {
          // Store Name
          if (key === '0') {
            store.name = value;
          } else if (value) store.products.push(value);
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

// Helper to port data from DEV to PROD
const getProductFields = record => {
  // Primary Keys, ID, and foreign keys do not persist across bases
  // Neither do computed values
  // Easier to whitelist for Products table
  const product = {
    category: record.category,
    name: record.name,
    detail: record.detail,
    customerCost: record.customerCost,
  };
  return product;
};

// Helper to port data from DEV to PROD
const getStoreFields = record => {
  // Primary Keys, ID, and foreign keys do not persist across bases
  // Neither do computed values
  const {
    primaryKey,
    id,
    productIds,
    clerkIds,
    transactionIds,
    ...desired
  } = record;
  return desired;
};

// Creates new products & stores if missing in PROD but exists in DEV
const createIfMissing = async () => {
  // TODO extract this to helper function for create for one table
  const devProducts = await getAllDevProducts();
  const devStores = await getAllDevStores();

  const prodProducts = await getAllProdProducts();
  const prodStores = await getAllProdStores();

  // Find records that exist in DEV but not PROD
  const prodMissingProducts = devProducts
    .filter(
      prodStore =>
        !prodProducts.find(record => record.fullName === prodStore.fullName)
    )
    .map(getProductFields);

  const prodMissingStores = devStores
    .filter(
      prodStore =>
        !prodStores.find(record => record.storeName === prodStore.storeName)
    )
    .map(getStoreFields);

  // Create records for missing Products and Stores
  const newProductIds = await createManyProducts(prodMissingProducts);
  const newStoreIds = await createManyStores(prodMissingStores);

  // Useful logging
  console.log('Products Missing in [PROD] Airtable: ');
  console.log(
    prodMissingProducts.map(record =>
      record.name.concat(', ').concat(record.detail)
    )
  );

  console.log('Stores Missing in [PROD] Airtable: ');
  console.log(prodMissingStores.map(record => record.storeName));

  if (newProductIds.length > 0) console.log('[newProductIds]: ', newProductIds);
  if (newStoreIds.length > 0) console.log('[newStoreIds]: ', newStoreIds);

  return newProductIds.concat(newStoreIds);
};

// Update all product records from DEV to PROD
// Update all store records from DEV to PROD
// Currently DOES NOT update linked records; use `updateStoreProducts` from a CSV for that
const updateAllDevProdInfo = async () => {
  // TODO extract to helper function to update for one table
  const devProducts = await getAllDevProducts();
  const devStores = await getAllDevStores();

  const prodProducts = await getAllProdProducts();
  const prodStores = await getAllProdStores();

  const products = devProducts
    .map(devRecord => {
      const prodId = prodProducts.find(
        prodRecord => prodRecord.fullName === devRecord.fullName
      ).id;
      // Only want to update the ID
      return { ...devRecord, id: prodId };
    })
    .map(newRecord => {
      return {
        id: newRecord.id,
        fields: getProductFields(newRecord),
      };
    });

  const stores = devStores
    .map(devRecord => {
      const prodId = prodStores.find(
        prodRecord => prodRecord.storeName === devRecord.storeName
      ).id;
      // Only want to update the ID
      return { ...devRecord, id: prodId };
    })
    .map(newRecord => {
      return { id: newRecord.id, fields: getStoreFields(newRecord) };
    });

  await updateManyProdProducts(products);
  await updateManyProdStores(stores);
};

// Updates per-record details from DEV to PROD
// Currently DOES NOT update linked records; use `updateStoreProducts` from a CSV for that
export const synchDevProd = async () => {
  // Copy all records from DEV Stores / Products to PROD, first creating records if missing
  const newIds = await createIfMissing();
  await updateAllDevProdInfo();
  return newIds;
};

// eslint-disable-next-line import/prefer-default-export
export const updateStoreProducts = async () => {
  const parsedData = await parseCsv();
  const currentStores = await getAllProdStores();
  const currentProducts = await getAllProdProducts();
  const missingStores = [];
  const missingProducts = [];

  const updatedStores = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const storeData of parsedData) {
    const { name, products } = storeData;
    const store = currentStores.find(record => record.storeName === name);
    if (!store) {
      console.log('Store not found in Airtable '.concat(name));
      missingStores.push(name);
      // eslint-disable-next-line no-continue
      continue;
    } else {
      const productIds = currentProducts
        .filter(record => products.includes(record.fullName))
        .map(record => record.id);

      updatedStores.push({
        id: store.id,
        fields: { productIds },
      });

      // Check if products or missing or incorrectly formatted
      const storeMissingProducts = products.filter(
        fullName =>
          !currentProducts.find(record => record.fullName === fullName)
      );
      storeMissingProducts.forEach(missing => {
        if (missingProducts.indexOf(missing) === -1)
          missingProducts.push(missing);
      });
    }
  }

  console.log('Stores Missing in Airtable: ');
  console.log(missingStores);

  console.log('Products Missing in Airtable: ');
  console.log(missingProducts);
  await updateManyProdStores(updatedStores);

  return updatedStores;
};
