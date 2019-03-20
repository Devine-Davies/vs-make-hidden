import * as fs from 'fs';

export function SaveFileAsync(filename:string, data:any) {
    return new Promise((resolve,reject) => {
        fs.writeFile(filename, data, (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
}

  //   fs.readFile(this.getSettingPath(), 'utf8', (err, rawFileData) => {
  //     /* -- Append the new config data to the main setting doc -- */
  //     var settingsDataParse = JSON.parse(rawFileData);
  //     settingsDataParse[vsSettingsKeys] = newExcludeObject;

  //     /* -- Make string and JSON valid -- */
  //     let formattedSettings: any = JSON.stringify(
  //         settingsDataParse, null, 2
  //     ).replace(/^[^{]+|[^}]+$/, '').replace(/(.+?[^:])\/\/.+$/gm, '$1');

  //     // let formattedSettings : any = JSON.stringify(settingsDataParse, null, "\t");

  //     fs.writeFile(this.getSettingPath(), formattedSettings, (err) => {
  //         /* -- Refresh out tree for view -- */
  //         this.refreshListView();
  //     });
  // });