import nodemailer from 'nodemailer';
import fs from 'fs';
import dotenv from 'dotenv-safe';
import { getAllRecords } from './lib/airtable-prod/airtable';
import { Tables } from './lib/airtable-prod/schema';

dotenv.config();

const sendEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailList = getAllRecords(Tables.Emails)
    .then((resp) => resp)
    .catch((e) => console.log(JSON.stringify(e)));

  const products = fs.readFileSync('./data/missingProducts.json', 'utf8');
  const stores = fs.readFileSync('./data/missingStores.json', 'utf8');

  const mailOptions = {
    from: 'DC Kitchen',
    to: emailList.map((item) => item.email),
    subject: '[DC Kitchen Updates] - Missing Stores and Products',
    html: `
			<!doctype html>
			<html>
				<h2>Attached is the missing stores and products</h2>
				<h3>Missing Products:</h3>
				<ul>
					${JSON.parse(products).reduce(
            (acc, product) => `${acc}<li>${product}</li>`,
            ''
          )}
				</ul>  
				<h3>Missing Stores:</h3>
				<ul>
					${JSON.parse(stores).reduce((acc, store) => `${acc}<li>${store}</li>`, '')}
				</ul>  
			</html>
			`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

// Can't use top-level await yet, so .then.catch it
sendEmail().catch((e) => {
  console.error(e);
});
