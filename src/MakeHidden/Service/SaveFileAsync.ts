import * as fs from "fs";
import { from, Observable } from "rxjs";

/**
 * Writes to a give file and returns promise
 * @param filename
 * @param data
 */
export const SaveFileAsync = (filename: string, data: any): Observable<any> => {
  return from(
    new Promise((resolve, reject) => {
      fs.writeFile(filename, data, (err) => (err ? reject(err) : resolve({})));
    })
  );
};
