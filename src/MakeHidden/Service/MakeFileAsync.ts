import * as fs from "fs";
import { from, Observable } from "rxjs";

/**
 *
 * @param path
 * @returns
 */
export const MakeFileAsync = (path: string): Observable<any> => {
  return from(
    new Promise((resolve, reject) => {
      fs.mkdir(path, (err) => (err ? reject(err) : resolve(path)));
    })
  );
};
