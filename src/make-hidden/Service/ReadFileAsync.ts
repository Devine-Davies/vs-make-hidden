import * as fs from 'fs';

export function ReadFileAsync(filename) {
    return new Promise((resolve,reject) => {
        fs.readFile(filename, { encoding: 'utf8' }, (err,result) => {
            if (err) reject(err);
            else {
                resolve(result)
            };
        });
    });
}