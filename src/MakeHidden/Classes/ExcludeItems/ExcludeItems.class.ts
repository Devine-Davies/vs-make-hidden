import { combineLatest, Observable } from "rxjs";
import { take, map, switchMap, tap } from "rxjs/operators";
import * as Util from "../../utilities";
import { AllItemsInDirectory } from "../../service";
import { ItemStore } from "../itemStore/itemStore.class";
import { ExcludeItemsViewPane } from "./excludeItems.viewpane";

interface ExcludeItemsObject {
  [s: string]: boolean;
}

interface RegexExcluder {
  self: string;
  byName: string;
  byNameWithExtension: string;
  allExtension: string;
}

interface HideLevelsObject {
  root: HideLevelObject;
  current: HideLevelObject;
  "current&below": HideLevelObject;
  below: HideLevelObject;
}

interface HideLevelObject {
  regexCode: String;
  incRelativePath: Boolean;
}

export class ExcludeItems {
  private store: ItemStore;
  private viewPaneId = `makeHidden.ViewPane.hiddenItems`;
  private viewPane: ExcludeItemsViewPane;

  /**
   *
   */
  constructor() {
    this.store = new ItemStore(
      Util.getVscodeSettingPath().full,
      `files.exclude`
    );
    this.viewPane = new ExcludeItemsViewPane(this.viewPaneId);
    this.onListUpdate();
  }

  /**
   * Called the the list has been updated
   */
  private onListUpdate(): void {
    this.getHiddenItemList$()
      .pipe(take(1))
      .subscribe((list) => this.viewPane.update(list));
  }

  /**
   *
   * @param list
   */
  public loadExcludedList$(list: string[]): Observable<any> {
    const store: ExcludeItemsObject = list.reduce(
      (acc, item: string) => ({
        ...acc,
        [item]: true,
      }),
      {}
    );
    return this.store.set(store).pipe(tap(() => this.onListUpdate()));
  }

  /**
   *
   */
  public getHiddenItemList$(): Observable<string[]> {
    return this.store.get().pipe(map((list) => Object.keys(list)));
  }

  /**
   * Remove an item from the current working directory
   * itemName: file/folder name
   * @param relativePath
   */
  public hide$(relativePath: string): Observable<any> {
    return this.store
      .addItem(relativePath, true)
      .pipe(tap(() => this.onListUpdate()));
  }

  /**
   *
   * @param dirname
   * @param items
   * @returns
   */
  public hideMultiple$(relativePaths: string[]): Observable<any> {
    const reduced = relativePaths.reduce(
      (acc, relativePath) => ({
        ...acc,
        [relativePath]: true,
      }),
      {}
    );

    return this.store.addMultiple(reduced).pipe(tap(() => this.onListUpdate()));
  }

  /**
   * Will hide an item from the projects directory
   * @param relativePath
   * @param includeExtension
   * @param hideLevelIndex
   */
  public hideMany$(
    relativePath: string = null,
    includeExtension: boolean = false,
    hideLevelIndex: number = 0
  ): Observable<any> {
    const excludeSnippets: RegexExcluder = this.buildExcludeRegex(
      relativePath,
      hideLevelIndex
    );

    return this.store.get().pipe(
      take(1),
      map((currentStore) =>
        includeExtension
          ? {
              // By Extension
              ...currentStore,
              [excludeSnippets["allExtension"]]: true,
            }
          : {
              // By Name
              ...currentStore,
              [excludeSnippets["byName"]]: true,
              [excludeSnippets["byNameWithExtension"]]: true,
            }
      ),
      switchMap((newStore: any) => this.store.set(newStore)),
      tap(() => this.onListUpdate())
    );
  }

  /**
   * Will hide an item from the projects directory
   * @param relativePath
   */
  public showOnly$(relativePath: string = null): Observable<any> {
    return this.showOnlyFilterer$(relativePath, 1).pipe(
      tap(() => this.onListUpdate())
    );
  }

  /**
   * Shows only the selected item within the directory
   * @param itemPath
   * @param hideLevel
   */
  private showOnlyFilterer$(
    itemPath: string = null,
    hideLevel: number = 0
  ): Observable<any> {
    const targetFilePathProps: any = Util.getPathInfoFromPath(itemPath);
    const workspacePath: any = Util.getVsCodeCurrentPath();
    const convertToExcludeObject = (items) =>
      items.reduce((acc, fileName) => {
        const filePath = `${targetFilePathProps["path"]}${fileName}`;
        const thisFileNamePathProps: any = Util.getPathInfoFromPath(filePath);
        const regexExcluder: RegexExcluder = this.buildExcludeRegex(
          filePath,
          hideLevel
        );

        let checks = {
          // Hide with opposite Names & Extension
          isDifferentName:
            targetFilePathProps["filename"] !=
            thisFileNamePathProps["filename"],
          isDifferentExtension:
            targetFilePathProps["extension"] !=
            thisFileNamePathProps["extension"],
        };

        if (checks["isDifferentName"]) {
          return {
            ...acc,
            [regexExcluder["byName"]]: true,
            [regexExcluder["byNameWithExtension"]]: true,
          };
        } else {
          if (targetFilePathProps["extension"]) {
            return {
              ...acc,
              [regexExcluder["byName"]]: true,
            };
          } else {
            return {
              ...acc,
              [regexExcluder["byNameWithExtension"]]: true,
            };
          }
        }
      }, {});

    return AllItemsInDirectory(
      `${workspacePath}/${targetFilePathProps["path"]}`
    ).pipe(
      map((dirItems) => convertToExcludeObject(dirItems)),
      switchMap((excludeObject) => this.store.set(excludeObject))
    );
  }

  /**
   * Make the item visible again in the main directory
   * @param regexItem
   */
  public makeVisible$(regexItem: string): Observable<any> {
    console.log("regexItem");
    console.log(regexItem);
    return this.store
      .removeItem(regexItem)
      .pipe(tap(() => this.onListUpdate()));
  }

  /**
   * Remove all hidden items, showing them in the main directory
   */
  public showAllItems$(): Observable<any> {
    return this.store.set({}).pipe(tap(() => this.onListUpdate()));
  }

  /**
   *
   */
  public undo$(): Observable<any> {
    const previousState: any = this.store.getPreviousState();
    const previousStore: string[] = Object.keys(previousState);
    return this.loadExcludedList$(previousStore);
  }

  /**
   * TODO:: Need to Refactor to own class
   * @param itemPath
   * @param hideLevelIndex
   */
  private buildExcludeRegex(
    itemPath: string = null,
    hideLevelIndex: number = 0
  ): RegexExcluder {
    let hideLevelObject: any = this.getHideLevelByIndex(hideLevelIndex);
    let itemPathProps: any = Util.getPathInfoFromPath(itemPath);
    let excludeSnippet: string = `${hideLevelObject.regexCode}`;

    // Check to see if to add item path
    if (hideLevelObject.incRelativePath) {
      excludeSnippet = `${itemPathProps["path"]}` + excludeSnippet;
    }

    return {
      self: `${itemPath}`,
      byName: `${excludeSnippet}${itemPathProps["filename"]}`,
      byNameWithExtension: `${excludeSnippet}${itemPathProps["filename"]}.*`,
      allExtension: `${excludeSnippet}*${itemPathProps["extension"]}`,
    };
  }

  /**
   * TODO:: Need to Refactor to own class
   * @param hideLevelIndex
   */
  private getHideLevelByIndex(hideLevelIndex: number = 0): HideLevelObject {
    const hideLevels = ["root", "current", "current&below", "below"];
    const hideLevelsObject: HideLevelsObject = {
      root: { regexCode: "**/", incRelativePath: false },
      current: { regexCode: "*", incRelativePath: true },
      "current&below": { regexCode: "**/", incRelativePath: true },
      below: { regexCode: "*/", incRelativePath: true },
    };

    const hideLevelKey: string = hideLevels[hideLevelIndex];
    const hideLevel: HideLevelObject = hideLevelsObject[hideLevelKey];
    return hideLevel;
  }
}
