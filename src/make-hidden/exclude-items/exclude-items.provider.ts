import * as json from 'jsonc-parser';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default class ExcludeItemsProvider implements vscode.TreeDataProvider<json.Node>  {

    public vsSettingsJsonPathInfo : any = {
        'absolute' : '',
        'relative' : `/.vscode/settings.json`,
        'path'     : `/.vscode/`,
        'filename' : `settings.json`,
    };

    private _onDidChangeTreeData: vscode.EventEmitter<json.Node | null> = new vscode.EventEmitter<json.Node | null>();
    readonly onDidChangeTreeData: vscode.Event<json.Node | null> = this._onDidChangeTreeData.event;

    // Object Tree
    private tree : json.Node;

    constructor(
        public mhUtilities: any = null,
    ) {
        /* -- Create link to main path -- */
        this.vsSettingsJsonPathInfo['absolute'] = vscode.workspace.rootPath + this.vsSettingsJsonPathInfo['relative'];

        /* -- Render our tree DOM -- */
        this.parseTree();
    }

    /* --------------------
     * vs code func : getChildren
     * dec: pass our tree object nodes to vs code
    */
    getChildren(node?: json.Node): Thenable<json.Node[]>  {
        return Promise.resolve( 
            this.tree ? this.tree.children : [] 
        );
    }

    /* --------------------
     * vs code func : getTreeItem
     * dec : pass our tree node item object to vs code
    */
    getTreeItem( node: json.Node ): vscode.TreeItem  {
        // dir name
        let itemTitle = node['children'][0]['value'];

        // vscode.TreeItemCollapsibleState.Collapsed
        let treeItem : vscode.TreeItem = new vscode.TreeItem(
            itemTitle, vscode.TreeItemCollapsibleState.None
        );

        treeItem.iconPath = this.mhUtilities.getProjectThemeDirectory( 'view.svg' );

        treeItem.contextValue = itemTitle;

        treeItem.command = {
            command   : 'make-hidden.removeItem',
            title     : itemTitle,
            arguments : [
                itemTitle
            ],
            tooltip   : itemTitle
        };

        return treeItem;
    }

    /* --------------------
     * Get user configuration file path
     * dec: Path to .vscode/settings.json
    */
    private getSettingsJsonPath() : string {
        return this.vsSettingsJsonPathInfo['absolute'];
    }

    /* --------------------
     * Parse tree
     * dec: render tree object with workspace_config
    */
    private parseTree(): void  {
        // Get our work space configuration object
        let workspace_config = this.getFilesExcludeObject();

        // Parse Tree accordingly
        this.tree = json.parseTree(
            JSON.stringify( workspace_config )
        );
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
    private createVscodeSettingJson(
        request_users_permission : boolean = true
    ) : void 
    {
        let path : string = vscode.workspace.rootPath + this.vsSettingsJsonPathInfo['path'];

        let noticeText: string = `No 'vscode/settings.json' has been found, would you like to create now`;
        let grantedText: string = 'Yes, Create File';

        vscode.window.showInformationMessage( 
            noticeText, grantedText
        ).then( ( selection : string ) => {
            if( selection === grantedText ) {

                fs.mkdir( path , e =>  {
                    fs.writeFile( this.getSettingsJsonPath() , `{}`, ( err ) =>  {
                        if ( err ) {
                            vscode.window.showInformationMessage(`Error creating settings.json in .vscode directory`);
                            throw err
                        };
                    });
                } );

            }
        });
    }

    /* --------------------
     * Save configuration
     * dec: Save files.exclude to configuration_file_path
    */
    public saveFilesExcludeObject( newExcludeObject : any )  {

        let vsSettingsKeys: string = 'files.exclude';

        /* -- check to see if there's a workspace available, if ask to create one -- */
        if( ! this.work_space_file_exists() ) {
            this.createVscodeSettingJson();
        }

        else {
            fs.readFile( this.getSettingsJsonPath(), 'utf8' , ( err, rawFildData ) => {

                /* -- Append the new config data to the main setting doc -- */
                var settingsDataParse = JSON.parse( rawFildData );    
                settingsDataParse[ vsSettingsKeys ] = newExcludeObject;

                /* -- Make string and JSON valid -- */
                let formattedSettings : any = JSON.stringify( 
                    settingsDataParse , null, 2
                ).replace(/^[^{]+|[^}]+$/, '').replace(/(.+?[^:])\/\/.+$/gm, '$1');
            
                fs.writeFile( this.getSettingsJsonPath() , formattedSettings , ( err ) => {
                    /* -- Refresh out tree for view -- */
                    this.refreshListView();
                } );
            });
        }
    }

    /* --------------------
     * Get workspace configuration
     * dec: in this case we want the files.exclude
    */
    public getFilesExcludeObject( ) : any
    {
        let configFile : string = this.getSettingsJsonPath();
        let jsonData   : string = '{}';

        try  {
            let readSettingsFile = JSON.parse( 
                fs.readFileSync( configFile, { encoding: 'utf8' } )
            );

            /* -- Create the files.exclude property if dose not exist -- */
            jsonData = ( readSettingsFile.hasOwnProperty( 'files.exclude' ) )? JSON.stringify( readSettingsFile['files.exclude'] ) : '{}';

        } catch (err)  {
            this.createVscodeSettingJson();
            console.log('error', 'reading config file', { details: err });
        }

        return JSON.parse( 
            jsonData 
        );
    }

    /* --------------------
     * Get file extension from path
     * dec: It will return the file extension if one has been found.
    */
    private work_space_file_exists() {
        return fs.existsSync( this.getSettingsJsonPath() )
    }

}