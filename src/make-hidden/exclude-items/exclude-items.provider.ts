import * as json from 'jsonc-parser';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import * as Util from '../utilities';
import { on } from 'cluster';

export default class ExcludeItemsProvider implements vscode.TreeDataProvider<json.Node>  {

    private _onDidChangeTreeData: vscode.EventEmitter<json.Node | null> = new vscode.EventEmitter<json.Node | null>();
    readonly onDidChangeTreeData: vscode.Event<json.Node | null> = this._onDidChangeTreeData.event;
    private tree : json.Node;
    private newTree : json.Node;

    constructor() {
        /* -- Render our tree DOM -- */
        this.parseTree();
    }

    /* --------------------
     * vs code func : getChildren
     * dec: pass our tree object nodes to vs code
    */
    public getChildren(node?: json.Node): Thenable<json.Node[]>  {
        return Promise.resolve(
            this.tree ? this.tree.children : []
        );
    }

    /* --------------------
     * vs code func : getTreeItem
     * dec : pass our tree node item object to vs code
    */
    public getTreeItem( node: json.Node ): vscode.TreeItem  {
        // dir name
        let itemTitle = node['children'][0]['value'];

        // vscode.TreeItemCollapsibleState.Collapsed
        let treeItem : vscode.TreeItem = new vscode.TreeItem(
            itemTitle, vscode.TreeItemCollapsibleState.None
        );

        treeItem.iconPath     = Util.getProjectThemeDirectory( 'put-back-icon.svg' );
        treeItem.contextValue = itemTitle;
        treeItem.command      = {
            command   : 'make-hidden.removeItem',
            title     : itemTitle,
            tooltip   : itemTitle,
            arguments : [itemTitle]
        };

        return treeItem;
    }

    /* --------------------
     * Get user configuration file path
     * dec: Path to .vscode/settings.json
    */
    private getSettingPath() : string {
        return Util.getVscodeSettingPath('full');
    }

    /* --------------------
     * Parse tree
     * dec: render tree object with workspace_config
    */
    private parseTree(): void  {
        // Get our work space configuration object
        // let fileExcludeObject: any = this.getFilesExcludeObject();
        let fileExcludeObject: any = Util.getItemFromJsonFile(
            this.getSettingPath(), 'files.exclude'
        );

        // FIX
        fileExcludeObject = this.fixRemove__Error( fileExcludeObject );

        if( fileExcludeObject != null ){
            // Update the tree Parse tree accordingly
            this.tree = json.parseTree( JSON.stringify(
                fileExcludeObject
            ) );
        }
    }

    /* --------------------
     * Get workspace configuration
     * dec: in this case we want the files.exclude
    */
    public getFilesExcludeObject( ) : any {
        let filesExclude = Util.getItemFromJsonFile(
            this.getSettingPath(), 'files.exclude'
        );

        if( filesExclude.hasOwnProperty( '__error' ) ){
            if ( filesExclude['__error'] === 'File not found' ) {
                this.creatSettingsFile();
                return null;
            }
        }

        return filesExclude;
    }

    /* --------------------
     * Refresh list
     * dec: Refresh the tree view
    */
    public refreshListView() : void {
        // Create a link to our hidden list model
        this.parseTree();

        // Fire the Callback func
        this._onDidChangeTreeData.fire();
    }

    /* --------------------
     * Create vc setting.json directory
    */
    private creatSettingsFile() : void  {
        Util.createVscodeSettingJson( true );
    }

    /* --------------------
     * Save configuration
     * dec: Save files.exclude to configuration_file_path
    */
    public saveFilesExcludeObject( newExcludeObject : any )  {

        let vsSettingsKeys: string = 'files.exclude';

        /* -- check to see if there's a workspace available, if ask to create one -- */
        if( ! Util.fileExists( this.getSettingPath() ) ) {
            this.creatSettingsFile();
        }

        else {
            fs.readFile( this.getSettingPath(), 'utf8' , ( err, rawFileData ) => {
                /* -- Append the new config data to the main setting doc -- */
                var settingsDataParse = JSON.parse( rawFileData );
                settingsDataParse[ vsSettingsKeys ] = newExcludeObject;

                /* -- Make string and JSON valid -- */
                let formattedSettings : any = JSON.stringify(
                    settingsDataParse , null, 2
                ).replace(/^[^{]+|[^}]+$/, '').replace(/(.+?[^:])\/\/.+$/gm, '$1');

                // let formattedSettings : any = JSON.stringify(settingsDataParse, null, "\t");

                fs.writeFile( this.getSettingPath() , formattedSettings , ( err ) => {
                    /* -- Refresh out tree for view -- */
                    this.refreshListView();
                } );
            });
        }
    }

    /* --------------------
     * FIX
    */
    private fixRemove__Error( object ) {
        let newObject = object;
        let remove = '__error';
        if( object.hasOwnProperty(remove) ){
            for( let item in newObject ){
                if( item === remove ){
                    delete newObject[ item ];
                }
            }
        }
        return newObject;
    }
}