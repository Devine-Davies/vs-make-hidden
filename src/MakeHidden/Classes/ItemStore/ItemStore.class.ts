/* -- Third party import's -- */
import * as console from 'console';;
import { LoadJSONAsync } from './../../Service/LoadJSONAsync';
import { SaveFileAsync } from './../../Service/SaveFileAsync';

export class ItemStore {
    // Holds the targets store last state
    previousState:any;

    constructor(
        private storePath: string,
        private storeName: string,
    ) { }

    /* --------------------
     * Loads and exposes the store (`files.exclude`)
    */
   public getPreviousState(): any {
       return this.previousState;
   }

    /* --------------------
     * Loads and exposes the store (`files.exclude`)
    */
    public get(): Promise<any> {
        return new Promise((resolve, reject) => {
            LoadJSONAsync(this.storePath, this.storeName).then((store) => {
                resolve(store)
            });
        });
    }

    /* --------------------
     * Update the settings.json file to hide the new regex items
    */
    public set(newStore: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const storePath: string = this.storePath;
            const storeName: string = this.storeName;
            LoadJSONAsync(storePath).then((res: any) => {
                // Check if store space exists
                if(!res[storeName]){ res[storeName] = {} }
                // Copy & Save the previous store state
                this.previousState = JSON.parse(JSON.stringify(res[storeName]));
                res[storeName] = newStore;
                SaveFileAsync(storePath, JSON.stringify(res, null, 2)).then(() => {
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
    public removeItem(itemKey: string = null): Promise<any> {
        return new Promise((resolve, reject) => {
            this.get().then((store: any) => {
                if (store[itemKey]) {
                    delete store[itemKey];
                    this.set(store).then(() => resolve(store));
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
    public addItem(itemKey: string, itemInfo: any) {
        return new Promise((resolve, reject) => {
            this.get().then((store: any) => {
                store[itemKey] = itemInfo;
                this.set(store).then(() => resolve(store));
            }).catch((err) => {
                console.log('good.json error', err.message); // never called
            });
        });
    }
}