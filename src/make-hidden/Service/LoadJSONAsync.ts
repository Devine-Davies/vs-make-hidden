import { ReadFileAsync } from './ReadFileAsync';
export function LoadJSONAsync(filename: string, key: string = undefined) {
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
