import * as fs from "fs";
import { from, Observable } from "rxjs";

/**
 * Reads a give file and returns content as a promise
 * @param filename
 */
export const ReadFileAsync = (filename: string): Observable<any> => {
  return from(
    new Promise((resolve, reject) => {
      fs.readFile(filename, { encoding: "utf8" }, (err, result) =>
        err ? reject(err) : resolve(result)
      );
    })
  );
};
