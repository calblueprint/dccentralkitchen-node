import fs from 'fs';

export default function saveFile(fileName, data) {
  const storesFile = fs.createWriteStream(fileName);
  storesFile.write(JSON.stringify(data));
  storesFile.close();
}
