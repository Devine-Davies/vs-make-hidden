// File system
import * as json from 'jsonc-parser';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export default class MakeHiddenProvider implements vscode.TreeDataProvider<json.Node>  {

    public project_setting_path : any = {
        'absolute' : '',
        'relative' : `/.vscode/settings.json`,
        'path'     : `/.vscode/`,
        'filename' : `settings.json`,
    };

    public config_type : string = '';
    public config_list : any = {
        'files'  : 'files.exclude',
        'search' : 'search.exclude',
    };

    private _onDidChangeTreeData: vscode.EventEmitter<json.Node | null> = new vscode.EventEmitter<json.Node | null>();
    readonly onDidChangeTreeData: vscode.Event<json.Node | null> = this._onDidChangeTreeData.event;

    // Object Tree
    private tree : json.Node;

    constructor(
        public context: vscode.ExtensionContext
    ) {
        /* -- Create link to main path -- */
        this.project_setting_path['absolute'] = vscode.workspace.rootPath + this.project_setting_path['relative'];

        /* -- Render our tree DOM -- */
        this.parse_tree();
    }

    /* --------------------
     * Get user configuration file path
     * dec: Path to .vscode/settings.json
    */
    get_user_configuration_file_path() : string
    {
        return this.project_setting_path['absolute'];
    }

    /* --------------------
     * Parse tree
     * dec: render tree object with workspace_config
    */
    private parse_tree(): void 
    {
        // Get our work space configuration object
        let workspace_config = this.get_workspace_configuration();

        // Parse Tree accordingly
        this.tree =  json.parseTree(
            JSON.stringify( workspace_config )
        );
    }

    /* --------------------
     * vs code func : getChildren
     * dec: pass our tree object nodes to vs code
    */
    getChildren(node?: json.Node): Thenable<json.Node[]> 
    {
        return Promise.resolve( this.tree ? this.tree.children : [] );
    }

    /* --------------------
     * vs code func : getTreeItem
     * dec : pass our tree node item object to vs code
    */
    getTreeItem( node: json.Node ): vscode.TreeItem 
    {
        // dir name
        let item_title = node['children'][0]['value'];

        // vscode.TreeItemCollapsibleState.Collapsed
        let hasCollapsibleState = vscode.TreeItemCollapsibleState.None;

        let treeItem : vscode.TreeItem = new vscode.TreeItem(
            item_title, hasCollapsibleState
        );

        treeItem.iconPath     = this.context.asAbsolutePath(path.join('resources', 'light', 'view.svg'));
        treeItem.contextValue = item_title;
        treeItem.command      = {
            command   : 'makeHidden.removeRegexFromList',
            title     : item_title,
            arguments : [ item_title ],
            tooltip   : item_title
        };

        return treeItem;
    }

    /* --------------------
     * Refresh list
     * dec: Refresh the tree view
    */
    refresh_list_view() : void
    {
        // Create a link to our hidden list model
        this.parse_tree();

        // let success = await vscode.commands.executeCommand('vscode.previewHtml', uri);
        // workbench.files.action.refreshFilesExplorer
        
        // Fire the Callback func 
        this._onDidChangeTreeData.fire();
    }

    /* --------------------
     * Save configuration
     * dec: Save files.exclude to configuration_file_path
    */
    protected save_configuration( config_data : any ) 
    {
        /* -- check to see if there's a workspace available-- */
        if( ! this.work_space_file_exists() )
        {
            /* -- If we fail to save, we shell try and create vs settings.json dir -- */
            this.create_vs_setting_directory();

            /* -- Quick timeout :( ) -- */
            setTimeout( () => {
                if ( this.work_space_file_exists() )  {
                    this.save_configuration( config_data );
                }
                else  {
                    vscode.window.showInformationMessage('The file could not be excluded, verify you have access');
                }
            }, 750);
        }
        else
        {
            fs.readFile( this.get_user_configuration_file_path(), 'utf8' , (err, data ) => {
    
                /* -- Append the new config data to the main setting doc -- */
                var settings_file_data = JSON.parse( data )
                    settings_file_data[ this.get_configuration_type() ] = config_data;

                /* -- Make string and JSON valid -- */
                let formatted_data : any  = JSON.stringify( settings_file_data , null, 2).replace(/^[^{]+|[^}]+$/, '').replace(/(.+?[^:])\/\/.+$/gm, '$1');
            
                fs.writeFile( this.get_user_configuration_file_path() , formatted_data )

                /* -- Refresh out tree for view -- */
                this.refresh_list_view();
        
                return true;
            })
        }
    }

    /* --------------------
     * Create visual code setting directory
     * dec: create .vscode/settings.json file
    */
    private create_vs_setting_directory() : void 
    {
        let path : string = vscode.workspace.rootPath + this.project_setting_path['path'];

        /* -- Make the vscode directory -- */
        fs.mkdir( path , e => 
        {
            vscode.window.showInformationMessage(`Created directory .vscode`);

            let file_content = '{}';

            fs.writeFile( this.get_user_configuration_file_path() , file_content, ( err ) => 
            {
                if ( err ) {
                    vscode.window.showInformationMessage(`Error creating settings.json in .vscode directory`);
                    throw err
                };

                vscode.window.showInformationMessage(`Created project settings.json`);
            });
        } );
    }

    /* --------------------
     * Get workspace configuration
     * dec: in this case we want the files.exclude
    */
    get_workspace_configuration( ) : object
    {
        let config_file : string = this.get_user_configuration_file_path();
        let json_data   : string = '{}';

        try 
        {
            fs.accessSync( config_file );

            let check = JSON.parse( fs.readFileSync( config_file, { encoding: 'utf8' } ) );

            /* -- Create the files.exclude property if dose not exist -- */
            json_data = ( ! check.hasOwnProperty( 'files.exclude' ) )? JSON.stringify( check['files.exclude'] ) : '{}';

            if( ! check.hasOwnProperty( 'files.exclude' ) )  
            {
                json_data = '{}';
            } 
            else 
            {
                json_data = JSON.stringify( check['files.exclude'] );
            }

        } catch (err) 
        {
            console.log('error', 'reading config file', { details: err });
        }

        if( json_data.length == 0 )
        {
            json_data = '{}';
        }

        return JSON.parse( json_data );
    }

    /* --------------------
     * Get configuration type
     * dec: Get the environment config type
    */
    get_configuration_type() : string
    {
        return this.config_type;
    }

    /* --------------------
     * Get file extension from path
     * dec: It will return the file extension if one has been found.
    */
    get_file_extension_from_path( filename : string = null ) : string
    {
        if( filename )
        {
            return filename.substring( filename.lastIndexOf('.') + 1, filename.length ) || '';
        }

        return '';
    }

    /* --------------------
     * Get file extension from path
     * dec: It will return the file extension if one has been found.
    */
    private work_space_file_exists()
    {
        return fs.existsSync( this.get_user_configuration_file_path() )
    }

}