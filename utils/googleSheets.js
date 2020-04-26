/* eslint-disable import/prefer-default-export */
import { google } from 'googleapis';

/**
 * Prints the contents of a test version of the sheet we care about (sheet is public to all users)
 * @see https://docs.google.com/spreadsheets/d/129BwSHKu-_qTMcpZKpqCp55qQWNipXft9tPOnqFkyB0/edit#gid=0
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
export async function listTestData(auth) {
  let result = '';
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: '129BwSHKu-_qTMcpZKpqCp55qQWNipXft9tPOnqFkyB0',
      range: 'Store-Products', // Read everything from the sheet
    });

    const rows = data.values;
    if (rows.length) {
      result = result.concat('<br>Store Name, First Product:<br>');
      // Print columns A and C, which correspond to indices 0 and 2.
      rows.forEach((row) => {
        result = result.concat(`<br>${row[0]}, ${row[2]}`);
      });
    } else {
      result = result.concat('No data found.');
    }
  } catch (err) {
    result = result.concat(`The API returned an error: ${err}`);
  }
  return result;
}
