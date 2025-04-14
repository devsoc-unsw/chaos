
// // Ensure the environment supports Node.js for 'fs' module usage




// /**
//  * Write the dataStore object to a file
//  * @returns void
//  * @throws {Error} If the file cannot be written
//  */
// export const writeData = (storageFilePath: string, data: any): void => {
//     fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2));
//   };
  
//   /**
//    * Fetch data from a file and update the dataStore object
//    * @returns void
//    * @throws {Error} If the file cannot be read
//    */
//   export const fetchData = (storageFilePath: string): void => {
//     if (!fs.existsSync(storageFilePath) || fs.statSync(storageFilePath).size === 0) {
//       // If the file does not exist or is empty, create a new one
//       writeData(storageFilePath, {});
//       return;
//     }
//     const data = JSON.parse(fs.readFileSync(storageFilePath, 'utf-8'));
//     return data;
//   };
