import nodemailer from 'nodemailer';
import fs from 'fs';
import dotenv from 'dotenv-safe';
import { getAllRecords } from './lib/airtable/airtable';
import { Tables } from './lib/airtable/schema';

dotenv.config();

const emails = ['wjenkins@blueraster.com'];

const sendEmail = async (emailList) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailsss = await getAllRecords(Tables.Emails)
    .then((resp) => resp)
    .catch((e) => console.log(JSON.stringify(e)));

  const products = fs.readFileSync('./missingProducts.json', 'utf8');
  const stores = fs.readFileSync('./missingStores.json', 'utf8');

  const mailOptions = {
    from: 'walter.k.jenkins@gmail.com',
    to: emailsss.map((item) => item.email),
    subject: '[DC Kitchen Updates] - Missing Stores and Products',
    html: `
			<!doctype html>
			<html>
				<h2>Attached is the missing stores and products</h2>
				<h3>Missing Products:</h3>
				<ul>
					${JSON.parse(products).map((product) => `<li>${product}</li>`)}
				</ul>  
				<h3>Missing Stores:</h3>
				<ul>
					${JSON.parse(stores).map((store) => `<li>${store}</li>`)}
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
sendEmail(emails).catch((e) => {
  console.error(e);
});
