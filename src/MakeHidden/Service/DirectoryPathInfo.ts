import * as path from 'path';

export interface DirectoryPathInfo {
  basename: string
  filename: string
  extension: string
  path: string
}

/* --------------------
*/
export function DirectoryPathInfo(givenPath: string = null, ): DirectoryPathInfo {
  let extension: string = path.extname(givenPath);
  let pathName: string = path.basename(givenPath);
  return {
      "basename": pathName,
      "filename": (extension === '') ? pathName : pathName.slice(0, -extension.length),
      "extension": extension,
      "path": givenPath.slice(0, -pathName.length)
  }
}
