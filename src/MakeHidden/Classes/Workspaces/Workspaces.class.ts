/* -- Third party import's -- */
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ItemStore } from "../ItemStore/ItemStore.class";

export interface Workspace {
  id: string;
  name: string;
  path: string;
  excludedItems: any;
}

export class Workspaces {
  store: ItemStore;
  workspaces: Workspace[];

  /**
   *
   * @param path
   */
  constructor(public path: string) {
    this.store = new ItemStore(path, `workspaces`);
  }

  /**
   *
   * @returns
   */
  public getWorkspaces(): Observable<Workspace[]> {
    return this.store.get();
  }

  /**
   *
   * @param paths
   * @returns
   */
  public getWorkspacesWithPath$(paths: string[]): Observable<Workspace[]> {
    return this.getWorkspaces().pipe(
      map((workspaces: any) => {
        return Object.keys(workspaces).reduce((acc: any, id: string) => {
          const workspace: Workspace = workspaces[id];
          return paths.includes(workspace.path) ? [...acc, workspace] : acc;
        }, []);
      })
    );
  }

  /**
   *
   * @param name
   * @returns
   */
  public getByName$(name: string): Observable<any> {
    return this.getWorkspaces().pipe(
      map((workspaces: any) =>
        Object.values(workspaces).find((item: any) => item.name === name)
      )
    );
  }

  /**
   * Creates & Saves a new workspace object
   * @param name
   * @param excludedItems
   * @param path
   */
  public create$(
    name,
    excludedItems,
    path: string = "global"
  ): Observable<any> {
    const workspace: Workspace = this.buildWorkspace(name, path, excludedItems);
    return this.store.addItem(workspace.id, workspace);
  }

  /**
   * Removes a given workspace by id
   * @param id
   * @returns
   */
  public removeById$(id: string): Observable<any> {
    return this.store.removeItem(id);
  }

  /**
   * Builds an workspace object for the store
   * @param name
   * @param path
   * @param items
   * @returns
   */
  protected buildWorkspace(
    name: string,
    path: string = "global",
    items: any = {}
  ): Workspace {
    return {
      id: this.guidGenerator(),
      name: name,
      path: path,
      excludedItems: items,
    };
  }

  /**
   * Create id
   * @returns
   */
  private guidGenerator(): string {
    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + "-" + S4();
  }
}
