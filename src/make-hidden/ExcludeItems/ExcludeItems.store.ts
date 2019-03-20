/* -- Third party import's -- */
import * as console from 'console';
import * as Util from '../utilities';
import { LoadJSONAsync } from '../Service/LoadJSONAsync';
import { SaveFileAsync } from '../Service/SaveFileAsync';

export default class ExcludeItemsStore {
    private storePath: string = Util.getVscodeSettingPath('full');
    private storeName: string = `files.exclude`;

    /* --------------------
     * Loads and exposes the store (`files.exclude`)
    */
    public get(): any {
        return new Promise((resolve, reject) => {
            LoadJSONAsync(this.storePath, this.storeName).then((store) => {
                resolve(store)
            });
        });
    }

    /* --------------------
     * Update the settings.json file to hide the new regex items
    */
    public set(newStore: any = {}): Thenable<any> {
        return new Promise((resolve, reject) => {
            const settingsPath: string = Util.getVscodeSettingPath('full');
            LoadJSONAsync(settingsPath).then((res: any) => {
                res[`files.exclude`] = newStore;
                SaveFileAsync(settingsPath, JSON.stringify(res, null, 2)).then(() => {
                    resolve(newStore);
                }).catch((err) => {
                    console.log('good.json error', err.message); // never called
                });
            }).catch((err) => {
                console.log('good.json error', err.message); // never called
            });
        });
    }

    /* --------------------
     * Remove regex from config list
     * When removing an item it will be placed back into the directory
    */
    public removeItem(item: string = null) {
        return new Promise((resolve, reject) => {
            this.get().then((store: any) => {
                if (store[item]) {
                    delete store[item];
                    this.set(store).then(() => {
                        resolve(store)
                    });
                }
            }).catch((err) => {
                console.log('good.json error', err.message); // never called
            });
        });
    }

    /* --------------------
     * Added regex from config list
     * When add an item it will be removed from the directory
    */
    public addItem(item: string = null) {
        return new Promise((resolve, reject) => {
            this.get().then((store: any) => {
                store[item] = true;
                this.set(store).then(() => {
                    resolve(store)
                });
            }).catch((err) => {
                console.log('good.json error', err.message); // never called
            });
        });
    }
}