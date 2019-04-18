import * as fs from 'fs';

/* --------------------
 * Reads a give file and returns content as a promise
*/
export function ReadFileAsync(filename): Promise<any> {
    return new Promise((resolve,reject) => {
        fs.readFile(filename, { encoding: 'utf8' }, (err,result) => {
            if (err) reject(err);
            else {
                resolve(result)
            };
        });
    });
}