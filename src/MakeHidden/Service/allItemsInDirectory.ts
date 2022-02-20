import * as fs from "fs";
import { from, Observable } from "rxjs";

/**
 * Reads a give file and returns content as a promise
 * @param filename
 */
export const AllItemsInDirectory = (path: string): Observable<any> => {
  return from(
    new Promise((resolve, reject) => {
      fs.readdir(path, { encoding: "utf8" }, (err, result) =>
        err ? reject(err) : resolve(result)
      );
    })
  );
};
