/* -- Third party import's -- */
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { LoadJSONAsync, SaveFileAsync } from "../../Service";

interface IStore {
  [key: string]: string | boolean;
}

export class ItemStore {
  /**
   * A way to keep the previous sate, for undo action
   */
  public previousState: IStore;

  /**
   *
   * @param storePath
   * @param storeName
   */
  constructor(private storePath: string, private storeName: string) {}

  /**
   *
   */
  public getPreviousState(): IStore {
    return this.previousState;
  }

  /**
   * Loads and exposes the store (`files.exclude`)
   */
  public get(): Observable<IStore | any> {
    return LoadJSONAsync(this.storePath, this.storeName);
  }

  /**
   * Update the settings.json file to hide the new regex items
   * @param newStore
   */
  public set(newStore: IStore) {
    const path = this.storePath;
    const storeName = this.storeName;
    return LoadJSONAsync(path).pipe(
      map((data) => ({
        ...data,
        [storeName]: newStore,
      })),
      switchMap((data) => SaveFileAsync(path, JSON.stringify(data, null, 2)))
    );
  }

  /**
   * Remove regex from config list
   * When removing an item it will be placed back into the directory
   * @param itemKey
   */
  public removeItem(itemKey: string = null): Observable<any> {
    return this.get().pipe(
      map((store) => {
        return Object.keys(store).reduce(
          (acc, key) =>
            key === itemKey
              ? acc
              : {
                  ...acc,
                  [key]: store[key],
                },
          {}
        );
      }),
      switchMap((store) => this.set(store))
    );
  }

  /**
   * Added regex from config list
   * When add an item it will be removed from the directory
   * @param itemKey
   * @param itemInfo
   */
  public addItem(itemKey: string, itemInfo: any) {
    return this.get().pipe(
      switchMap((store: any) => this.set({ ...store, [itemKey]: itemInfo }))
    );
  }

  /**
   * Added regex from config list
   * When add an item it will be removed from the directory
   * @param itemKey
   * @param itemInfo
   */
  public addMultiple(itemKey: any) {
    return this.get().pipe(
      switchMap((store: any) => this.set({ ...store, ...itemKey }))
    );
  }
}
