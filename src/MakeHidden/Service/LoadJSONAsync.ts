import { ReadFileAsync } from './ReadFileAsync';

/* --------------------
 * Reads a give file and returns a slice of the json as a
 : TODO:: Why dose exclude still work with out key given??
*/
export function LoadJSONAsync(filename: string, key: string = undefined): Promise<any> {
  return new Promise((resolve, reject) => {
    return ReadFileAsync(filename).then((res: any) => {
      const json = JSON.parse(res);
      if (key) {
        resolve(json[key] || {});
      }

      resolve(json)
    }).catch((e) => console.log(e))
  });
}
