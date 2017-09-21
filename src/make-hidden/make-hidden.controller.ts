import * as vscode from 'vscode';
// import * as ChildProcess from 'child_process';
import MakeHiddenProvider from './make-hidden.provider';

export default class MakeHiddenController extends MakeHiddenProvider {

    constructor(
        public context: vscode.ExtensionContext
    ) 
    {
        super( context );
        this.config_type = this.config_list[ 'files' ];
    }

    /* --------------------
     * Hide item
     * dec: Appends the dir/file name into vs code user settings file.excludes
    */
    hide_item( relative_location_to_item : string = null ) : void
    {
        if ( relative_location_to_item )
        {
            // Get workspace and append item
            let workspace_config  : any = this.get_workspace_configuration();
                workspace_config[ relative_location_to_item ] = true;

            this.save_configuration( workspace_config );
        }
    }

    /* --------------------
     * Hide all extension types
     * dec: Appends the dir/file name into vs code user settings file.excludes
    */
    hide_all_extension_types( item_path : string = null, from_root : boolean = true ) : void
    {
        if ( item_path )
        {
            let extension_type : string = this.get_file_extension_from_path( item_path );
            let file_name : string = item_path.substring( item_path.lastIndexOf('/') + 1 );

            if( extension_type !== '' )
            {
                let exclude_snippet   : string = '';
                let workspace_config  : any = this.get_workspace_configuration();

                if( from_root )
                {
                    exclude_snippet = `*/**/**.${extension_type}`;
                }
                else
                {
                    // Get the item full path
                    var item_path   = item_path.replace( file_name , "");
                    exclude_snippet = `${item_path}*.${extension_type}`;
                }

                // Append our newly selected item
                workspace_config[ exclude_snippet ] = true;

                /* -- Save the new work space -- */
                this.save_configuration( workspace_config );

                /* -- Run a count on all effected files -- */
                // this.count_all_affected_files( exclude_snippet );
            }
        }
    }

    /* --------------------
     * Remove regex from config list : Remove item
     * dec: Removes an item from the config list
    */
    remove_regex_from_config_list( item_key : string = null ) : void
    {
        if( item_key )
        {
            let workspace_config  : any = this.get_workspace_configuration();
                delete workspace_config[ item_key ];

            this.save_configuration( workspace_config )
        }
    }

    /* --------------------
     * Remove all regex item's from config list
     * dec: removes all items in get_workspace_configuration(files.exclude)
    */
    remove_all_regex_items_from_config_list() : void
    {
        /* -- TODO: have this return the feed back message from writeFileSync for errors and successes -- */
        this.save_configuration( {} );
    }

    /* --------------------
     * Effected files counter
     * dec: info windows displays a count of all affected files
    */
    count_all_affected_files( exclude_snippet : string = null )
    {
        // ChildProcess.exec(`cd ${vscode.workspace.rootPath} && find ${exclude_snippet}  -type f | wc -l`, (error, stdout, stderr) => {
        //     if (error) {
        //         console.error(`exec error: ${error}`);
        //         return;
        //     }
    
        //     // vscode.window.showInformationMessage(`Affected files: ${stdout}`);
        //     // console.log(`stdout: ${stdout}`);
        // });
    }

}