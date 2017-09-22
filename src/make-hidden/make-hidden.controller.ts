import { CONNREFUSED } from 'dns';
import * as vscode from 'vscode';
import * as ChildProcess from 'child_process';
import MakeHiddenProvider from './make-hidden.provider';
import * as console from 'console';

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
            let exclude_snippet : string = '';
            let item_info : any = {
                'extension' : this.get_item_dir_info( item_path, 'extension' ),
                'file_name' : this.get_item_dir_info( item_path, 'filename'  ),
                'path'      : this.get_item_dir_info( item_path, 'path'      ),
            };

            if( item_info['extension'] === '' ) {
                /* -- Folder -- */
                exclude_snippet = ( from_root )? `*/**/${item_info['file_name']}` : `${ item_info['path'] }${ item_info['file_name'] }`;
            } else {
                /* -- File -- */
                exclude_snippet = ( from_root )? `*/**/**.${ item_info['extension'] }` : `${ item_info['path'] }*.${ item_info['extension'] }`;
            }

            console.log( exclude_snippet );

            /* -- Append our newly selected item -- */
            let workspace_config : any = this.get_workspace_configuration();
                workspace_config[ exclude_snippet ] = true;

            /* -- Save the new work space -- */
            this.save_configuration( workspace_config );

            /* -- Run a count on all effected files -- */
            this.count_all_affected_files( exclude_snippet );
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
        let os_type : string = process.platform;
        let all_os_types : string[]     = ['darwin', 'freebsd', 'linux', 'sunos', 'win32'];
        let allowed_os_types : string[] = [ 'darwin', 'linux' ];

        if( allowed_os_types.indexOf( os_type ) > -1 )
        {
            ChildProcess.exec(`cd ${vscode.workspace.rootPath} && find ${exclude_snippet}  -type f | wc -l`, (error, stdout, stderr) => {
                
                if (error) {
                    console.error(`exec error: ${error}`); return;
                }
        
                vscode.window.showInformationMessage(`Affected files: ${stdout}`);
            });
        }
    }

}