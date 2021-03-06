/* eslint no-restricted-imports: 0 */
/* eslint-disable no-unused-vars */

/*
  THIS IS A GENERATED FILE
  Changes might be overwritten in the future, edit with caution!

  Wrapper functions around functions in airtable.js that interact with Airtable, designed
  to provide basic functionality

  If you're adding a new function: make sure you add a corresponding test (at least 1) for it in request.spec.js

*/

import { Tables, Columns } from './schema';
import {
  createRecord,
  updateRecord,
  getAllRecords,
  getRecordsByAttribute,
  getRecordById,
  deleteRecord,
} from './airtable';

/*
 ******* CREATE RECORDS *******
 */

export const createCustomers = async (record) => {
  return createRecord(Tables.Customers, record);
};

export const createPushTokens = async (record) => {
  return createRecord(Tables.PushTokens, record);
};

export const createClerks = async (record) => {
  return createRecord(Tables.Clerks, record);
};

export const createStores = async (record) => {
  return createRecord(Tables.Stores, record);
};

export const createProducts = async (record) => {
  return createRecord(Tables.Products, record);
};

export const createLineItems = async (record) => {
  return createRecord(Tables.LineItems, record);
};

export const createTransactions = async (record) => {
  return createRecord(Tables.Transactions, record);
};

export const createRecipes = async (record) => {
  return createRecord(Tables.Recipes, record);
};

export const createResources = async (record) => {
  return createRecord(Tables.Resources, record);
};

export const createNews = async (record) => {
  return createRecord(Tables.News, record);
};

export const createReceipts = async (record) => {
  return createRecord(Tables.Receipts, record);
};

export const createSales = async (record) => {
  return createRecord(Tables.Sales, record);
};

/*
 ******* READ RECORDS *******
 */

export const getCustomersById = async (id) => {
  return getRecordById(Tables.Customers, id);
};

export const getCustomersByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Customers, formula);
};

export const getAllCustomers = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Customers, filterByFormula, sort);
};

export const getPushTokensById = async (id) => {
  return getRecordById(Tables.PushTokens, id);
};

export const getPushTokensByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.PushTokens, formula);
};

export const getAllPushTokens = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.PushTokens, filterByFormula, sort);
};

export const getClerksById = async (id) => {
  return getRecordById(Tables.Clerks, id);
};

export const getClerksByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Clerks, formula);
};

export const getAllClerks = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Clerks, filterByFormula, sort);
};

export const getStoresById = async (id) => {
  return getRecordById(Tables.Stores, id);
};

export const getStoresByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Stores, formula);
};

export const getAllStores = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Stores, filterByFormula, sort);
};

export const getStoresByStoreName = async (value, sort = []) => {
  return getRecordsByAttribute(
    Tables.Stores,
    Columns[Tables.Stores].storeName.name,
    value,
    sort
  );
};

export const getProductsById = async (id) => {
  return getRecordById(Tables.Products, id);
};

export const getProductsByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Products, formula);
};

export const getAllProducts = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Products, filterByFormula, sort);
};

export const getProductsByFullName = async (value, sort = []) => {
  return getRecordsByAttribute(
    Tables.Products,
    Columns[Tables.Products].fullName.name,
    value,
    sort
  );
};

export const getLineItemsById = async (id) => {
  return getRecordById(Tables.LineItems, id);
};

export const getLineItemsByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.LineItems, formula);
};

export const getAllLineItems = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.LineItems, filterByFormula, sort);
};

export const getTransactionsById = async (id) => {
  return getRecordById(Tables.Transactions, id);
};

export const getTransactionsByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Transactions, formula);
};

export const getAllTransactions = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Transactions, filterByFormula, sort);
};

export const getRecipesById = async (id) => {
  return getRecordById(Tables.Recipes, id);
};

export const getRecipesByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Recipes, formula);
};

export const getAllRecipes = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Recipes, filterByFormula, sort);
};

export const getResourcesById = async (id) => {
  return getRecordById(Tables.Resources, id);
};

export const getResourcesByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Resources, formula);
};

export const getAllResources = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Resources, filterByFormula, sort);
};

export const getNewsById = async (id) => {
  return getRecordById(Tables.News, id);
};

export const getNewsByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.News, formula);
};

export const getAllNews = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.News, filterByFormula, sort);
};

export const getReceiptsById = async (id) => {
  return getRecordById(Tables.Receipts, id);
};

export const getReceiptsByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Receipts, formula);
};

export const getAllReceipts = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Receipts, filterByFormula, sort);
};

export const getSalesById = async (id) => {
  return getRecordById(Tables.Sales, id);
};

export const getSalesByIds = async (ids) => {
  const formula = `OR(${ids.reduce(
    (f, id) => `${f} {ID}='${id}',`,
    ''
  )} 1 < 0)`;
  return getAllRecords(Tables.Sales, formula);
};

export const getAllSales = async (filterByFormula = '', sort = []) => {
  return getAllRecords(Tables.Sales, filterByFormula, sort);
};

/*
 ******* UPDATE RECORDS *******
 */

export const updateCustomers = async (id, recordUpdates) => {
  return updateRecord(Tables.Customers, id, recordUpdates);
};

export const updatePushTokens = async (id, recordUpdates) => {
  return updateRecord(Tables.PushTokens, id, recordUpdates);
};

export const updateClerks = async (id, recordUpdates) => {
  return updateRecord(Tables.Clerks, id, recordUpdates);
};

export const updateStores = async (id, recordUpdates) => {
  return updateRecord(Tables.Stores, id, recordUpdates);
};

export const updateProducts = async (id, recordUpdates) => {
  return updateRecord(Tables.Products, id, recordUpdates);
};

export const updateLineItems = async (id, recordUpdates) => {
  return updateRecord(Tables.LineItems, id, recordUpdates);
};

export const updateTransactions = async (id, recordUpdates) => {
  return updateRecord(Tables.Transactions, id, recordUpdates);
};

export const updateRecipes = async (id, recordUpdates) => {
  return updateRecord(Tables.Recipes, id, recordUpdates);
};

export const updateResources = async (id, recordUpdates) => {
  return updateRecord(Tables.Resources, id, recordUpdates);
};

export const updateNews = async (id, recordUpdates) => {
  return updateRecord(Tables.News, id, recordUpdates);
};

export const updateReceipts = async (id, recordUpdates) => {
  return updateRecord(Tables.Receipts, id, recordUpdates);
};

export const updateSales = async (id, recordUpdates) => {
  return updateRecord(Tables.Sales, id, recordUpdates);
};

/*
 ******* DELETE RECORDS *******
 */

export const deleteCustomers = async (id) => {
  return deleteRecord(Tables.Customers, id);
};
export const deletePushTokens = async (id) => {
  return deleteRecord(Tables.PushTokens, id);
};
export const deleteClerks = async (id) => {
  return deleteRecord(Tables.Clerks, id);
};
export const deleteStores = async (id) => {
  return deleteRecord(Tables.Stores, id);
};
export const deleteProducts = async (id) => {
  return deleteRecord(Tables.Products, id);
};
export const deleteLineItems = async (id) => {
  return deleteRecord(Tables.LineItems, id);
};
export const deleteTransactions = async (id) => {
  return deleteRecord(Tables.Transactions, id);
};
export const deleteRecipes = async (id) => {
  return deleteRecord(Tables.Recipes, id);
};
export const deleteResources = async (id) => {
  return deleteRecord(Tables.Resources, id);
};
export const deleteNews = async (id) => {
  return deleteRecord(Tables.News, id);
};
export const deleteReceipts = async (id) => {
  return deleteRecord(Tables.Receipts, id);
};
export const deleteSales = async (id) => {
  return deleteRecord(Tables.Sales, id);
};
