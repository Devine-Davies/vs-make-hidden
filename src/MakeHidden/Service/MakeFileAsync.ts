import * as fs from "fs";
import { from, Observable } from "rxjs";
import * as Util from "../utilities";

/**
 *
 * @param path
 * @returns
 */
export const MakeFileAsync = (path: string): Observable<any> => {
  Util.displayVsCodeMessage(`This is the path: ${path}`, false);

  return from(
    new Promise((resolve, reject) => {
      fs.mkdir(path, (err) => {
        return err ? reject(err) : resolve(path);
      });
    })
  );
};
