import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ReadFileAsync } from "./readFileAsync";

/**
 * Reads a give file and returns a slice of the json as a
 * @param filename
 * @param key
 */
export const LoadJSONAsync = (
  filename: string,
  key?: string
): Observable<any> => {
  return ReadFileAsync(filename).pipe(
    map((data: string) => JSON.parse(data)),
    map((data) => (key ? data[key] : data))
  );
};
