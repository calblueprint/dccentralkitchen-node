import { getAllProducts, getAllStores } from '../lib/airtable/request';

const csv = require('csv-parser');
const fs = require('fs');

// eslint-disable-next-line import/prefer-default-export
export const updateStoreProducts = async () => {
  const parsedData = await parseCsv();
  const currentStores = await getAllStores();
  const currentProducts = await getAllProducts();
  const missingStores = [];
  const missingProducts = [];

  const updatedStores = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const storeData of parsedData) {
    const { name, products } = storeData;
    // console.log(name, products);
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
        fields: { Products: productIds },
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

  // const updatePromises = [];
  // console.log(updatedStores.length);
  // const numCalls = Math.ceil(updatedStores.length / 10);
  // for (let i = 0; i < numCalls; i += 1) {
  //   const subset = updatedStores.slice(i * 10, (i + 1) * 10);
  //   console.log(subset);
  //   if (subset.length > 0) updatePromises.push(updateManyStores(subset));
  // }
  // await Promise.all(updatePromises);

  return parsedData;
};

// for (var res of fetchResponses){ //node-fetch package responses
//     const dest = fs.createWriteStream(filePath,{flags:'a'});
//     totalBytes += Number(res.headers.get('content-length'));
//     await new Promise((resolve, reject) => {
//         res.body.pipe(dest);
//         res.body.on("error", (err) => {
//             reject(err);
//         });
//         dest.on("finish", function() {
//             resolve();
//         });
//     });
// }

const parseCsv = async () => {
  const storeData = [];
  const filename = 'storeproducts_2020apr2-12.csv';
  const src = fs.createReadStream(filename);
  const end = new Promise(function(resolve, _) {
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
