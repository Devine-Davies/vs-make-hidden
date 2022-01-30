import * as fs from "fs";
import { from } from "rxjs";

/**
 * Writes to a give file and returns promise
 * @param filename
 * @param data
 */
export const SaveFileAsync = (filename: string, data: any) => {
  return from(
    new Promise((resolve, reject) => {
      fs.writeFile(filename, data, (err) => (err ? reject(err) : resolve({})));
    })
  );
};
