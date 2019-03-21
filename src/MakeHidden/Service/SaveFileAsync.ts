import * as fs from 'fs';

/* --------------------
 * Writes to a give file and returns promise
*/
export function SaveFileAsync(filename:string, data:any) {
    return new Promise((resolve,reject) => {
        fs.writeFile(filename, data, (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
}