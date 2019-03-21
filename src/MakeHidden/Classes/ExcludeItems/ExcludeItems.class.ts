/* -- Make hidden lib's -- */
import * as Util from '../../utilities';
import { DirectoryPathInfo } from '../../Service/DirectoryPathInfo';

import { ItemStore } from '../ItemStore/ItemStore.class';
import ExcludeItemsViewPane from './ExcludeItems.viewpane';
import { Workspace } from '../Workspaces/Workspaces.class';

interface ExcludeItemsObject {
    [s: string]: boolean
}

interface RegexExcluder {
    self:string
    byName:string
    byNameWithExtension:string
    allExtension:string
}

export default class ExcludeItems {
    private store: ItemStore;
    private viewPane: ExcludeItemsViewPane;

    private hideLevels: string[] = ["root", "current", "current&below", "below"];
    private hideLevelsObject: any = {
        "root": { regexCode: '**/', incPath: false },
        "current": { regexCode: '*', incPath: true },
        "current&below": { regexCode: '**/', incPath: true },
        "below": { regexCode: '*/', incPath: true },
    };

    constructor() {
        this.store = new ItemStore(Util.getVscodeSettingPath('full'), `files.exclude`);
        this.viewPane = new ExcludeItemsViewPane(`makeHiddenViewPane`);

        this.onListUpdate();
    }

    /* --------------------
     * Called the the list has been updated
    */
    private onListUpdate() {
        this.getHiddenItemList().then((list: string[]) => {
            this.viewPane.update(list);
        });
    }

    /* --------------------
     * Expose the list
    */
    public loadExcludedList(list: string[]): void {
        // Format for store
        let store: ExcludeItemsObject = {};
        list.map((item:string) => store[item] = true);

        // Update the view
        this.store.set(store).then(() => this.onListUpdate());
    }

    /* --------------------
     * Have done this here as i think it will be good when
     * formatting the list, e.g by file type(.exe) name acs/desc
    */
    public getHiddenItemList(): Promise<String[]> {
        return new Promise((resolve, reject) => {
            this.store.get().then((store: ExcludeItemsObject) => {
                // quick cheep way to get the as string[] might want to check in future
                const keys: string[] = Object.keys(store);
                resolve(keys);
            });
        });
    }

    /* --------------------
     * Remove an item from the current working directory
     * itemName: file/folder name
    */
    public hideItem(itemName: string): void {
        this.store.addItem(itemName, true).then(
            (store:ExcludeItemsObject) => this.onListUpdate()
        );
    }

    /* --------------------
     * Will hide an item from the projects directory
    */
    public hideItems(itemPath: string = null, includeExtension: boolean = false, hideLevelIndex: number = 0) {
        this.store.get().then((filesExcludeObject: ExcludeItemsObject) => {
            let itemPathProps: DirectoryPathInfo = DirectoryPathInfo(itemPath);
            let excludeSnippets: RegexExcluder = this.buildExcludeRegex(itemPath, hideLevelIndex);

            if (!includeExtension) {
                filesExcludeObject[excludeSnippets['byName']] = true;
                filesExcludeObject[excludeSnippets['byNameWithExtension']] = true;
            }

            // By Extension
            if (includeExtension && itemPathProps['extension'] !== '.') {
                filesExcludeObject[excludeSnippets['allExtension']] = true;
            }

            /* -- Save the new work space -- */
            this.store.set(filesExcludeObject).then(() => {
                this.onListUpdate();
            });
        });
    }

    /* --------------------
     * Will hide an item from the projects directory
    */
    public showOnly(itemPath: string = null) {
        if (itemPath) {
            this.showOnlyFilterer(itemPath, true, false, 1);
        }
    }

    /* --------------------
     * TODO:: Need to Refactor to own class
     */
    private showOnlyFilterer(
        itemPath: string = null,
        matchByName: boolean = true,
        matchByExtension: boolean = true,
        hideLevel: number = 0
    ) {
        if (itemPath) {
            let targetFilePathProps: any = Util.getPathInfoFromPath(itemPath);
            let workspacePath: any = Util.getVsCodeCurrentPath();;

            var targetFile = `${targetFilePathProps['basename']}`;
            this.store.get().then((filesExcludeObject: any) => {
                let allItemInPath: string[] = Util.getAllItemsInDir(
                    `${workspacePath}/${targetFilePathProps['path']}`
                );

                for (var fileName of allItemInPath) {
                    if (fileName != targetFile) {
                        let filePath = `${targetFilePathProps['path']}${fileName}`;

                        let thisFileNamePathProps: any = Util.getPathInfoFromPath(filePath);

                        let excludeSnippets: any = this.buildExcludeRegex(
                            filePath, hideLevel
                        );

                        let checks = {
                            'byName': (matchByName),
                            'byExtension': (matchByExtension && thisFileNamePathProps['extension'] !== ""),

                            // Hide with opposite Names & Extension
                            'isDifferentNames': (targetFilePathProps['filename'] != thisFileNamePathProps['filename']),
                            'isDifferentExtension': (targetFilePathProps['extension'] != thisFileNamePathProps['extension']),
                        }

                        if (checks['byName']) {
                            if (checks['isDifferentNames']) {
                                filesExcludeObject[excludeSnippets['byName']] = true;
                                filesExcludeObject[excludeSnippets['byNameWithExtension']] = true;
                            }
                        }

                        if (checks['byExtension']) {
                            if (checks['isDifferentNames'] && checks['isDifferentExtension']) {
                                filesExcludeObject[excludeSnippets['allExtension']] = true;
                            }
                        }
                    }
                }

                /* -- Save the new work space -- */
                this.store.set(filesExcludeObject).then(() => {
                    this.onListUpdate();
                });
            });
        }
    }

    /* --------------------
     * Make the item visible again in the main directory
    */
    public makeVisible(regexItem: string): void {
        this.store.removeItem(regexItem).then(() => {
            this.getHiddenItemList().then((list: string[]) => {
                this.viewPane.update(list);
            });
        });
    }

    /* --------------------
     * Remove all hidden items, showing them in the main directory
    */
    public showAllItems() {
        /* -- Save the new work space -- */
        this.store.set({}).then(() => {
            this.onListUpdate();
        });
    }

    /* --------------------
     *
    */
    public undo() {
        const previousState: Workspace[] = this.store.getPreviousState();
        const previousStore: string[] = Object.keys(previousState);
        this.loadExcludedList(previousStore)
    }

    /* --------------------
    * TODO:: Need to Refactor to own class
    */
    private buildExcludeRegex(itemPath: string = null, hideLevelIndex: number = 0): RegexExcluder {
        let hideLevelObject: any = this.getHideLevelByIndex(hideLevelIndex);
        let itemPathProps: any = Util.getPathInfoFromPath(itemPath);
        let excludeSnippet: string = `${hideLevelObject.regexCode}`;

        // Check to see if to add item path
        if (hideLevelObject.incPath) {
            excludeSnippet = `${itemPathProps['path']}` + excludeSnippet;
        }

        return {
            'self': `${itemPath}`,
            'byName': `${excludeSnippet}${itemPathProps['filename']}`,
            'byNameWithExtension': `${excludeSnippet}${itemPathProps['filename']}.*`,
            'allExtension': `${excludeSnippet}*${itemPathProps['extension']}`,
        }
    }

    /* --------------------
    * TODO:: Need to Refactor to own class
    */
    private getHideLevelByIndex(hide_level_index: number = 0) {
        let hide_level: string = this.hideLevels[hide_level_index];
        let hide_level_object: any = this.hideLevelsObject[hide_level];
        return hide_level_object;
    }
}
