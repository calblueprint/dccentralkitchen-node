import moment from 'moment';
import {
  getAllCustomers as getAllProdCustomers,
  getStoresByIds as getProdStoresByIds,
} from '../lib/airtable-prod/request';
import {
  getAllCustomers as getAllDevCustomers,
  getStoresByIds as getDevStoresByIds,
} from '../lib/airtable/request';

/**
 * Cleans up the customer record from Airtable by filtering only favorite stores:
 * - with latestDelivery date matching the current date
 * - with productIds (at least one product available)
 * - not marked as doNotDisplay
 *
 * Returns the customer record with:
 * - valid store names (array)
 * - name (string)
 * - phone number (string)
 */
async function getFavoriteStoreNames(cust, base) {
  let customer = null;
  try {
    let stores = [];
    if (base === 'DEV') {
      stores = await getDevStoresByIds(cust.favoriteStoreIds);
    } else if (base === 'PROD') {
      stores = await getProdStoresByIds(cust.favoriteStoreIds);
    } else {
      console.log(
        "Error: please check the inputted value for the 'base' parameter"
      );
    }

    const storeNames = [];
    stores.forEach((store) => {
      // latestDelivery cannot be undefined
      // if undefined, moment will falsely set it to today
      if (
        store.latestDelivery &&
        moment(store.latestDelivery).format('MM/DD/YYYY') ===
          moment().format('MM/DD/YYYY') &&
        !store.doNotDisplay &&
        store.productIds
      ) {
        storeNames.push(store.storeName);
      }
    });
    customer = {
      name: cust.name,
      favoriteStores: storeNames,
      phoneNumber: cust.phoneNumber,
    };
  } catch (err) {
    console.error(err);
  }
  return customer;
}

/**
 * Retrieves and returns all customer records from Airtable where the customer
 * has at least 1 'favorite store' and SMS Delivery Notifications enabled.
 * Uses the getFavoriteStoreNames helper to clean up customer records.
 */
export default async function getCustomers(base) {
  let customers = [];
  try {
    const formulaStr =
      "AND(NOT({Favorite Stores} = ''), SEARCH('SMS', {Delivery Notifications}))";
    let customerData;
    if (base === 'DEV') {
      customerData = await getAllDevCustomers(formulaStr);
    } else if (base === 'PROD') {
      customerData = await getAllProdCustomers(formulaStr);
    } else {
      console.log(
        "Error: please check the inputted value for the 'base' parameter",
        base
      );
    }
    customers = Promise.all(
      customerData.map(async (customer) => {
        return getFavoriteStoreNames(customer, base);
      })
    );
  } catch (err) {
    console.error(err);
  }
  return customers;
}
