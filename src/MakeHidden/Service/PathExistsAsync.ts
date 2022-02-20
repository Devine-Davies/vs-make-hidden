import * as fs from "fs";
import { from, Observable } from "rxjs";

/**
 *
 * @param path
 * @returns
 */
export const PathExistsAsync = (path: string): Observable<any> => {
  return from(
    new Promise((resolve, reject) => {
      fs.stat(path, (err) => (err ? reject(err) : resolve(path)));
    })
  );
};
