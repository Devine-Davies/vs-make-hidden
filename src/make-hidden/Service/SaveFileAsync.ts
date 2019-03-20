import * as fs from 'fs';

export function SaveFileAsync(filename:string, data:any) {
    return new Promise((resolve,reject) => {
        fs.writeFile(filename, data, (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
}