'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as console from 'console';
import * as path from 'path';

/* -- Make hidden lib's -- */
import Utilities from './make-hidden/utilities';
import ExcludeItemsController from './make-hidden/exclude-items/exclude-items.controller';
// import MakeHiddenLayoutManager from './layout-manager/layout-manager.controller';


/* --------------------
 * Extension activated methord
 * ---------------------------------------------------------------
 * Command is executed and extension is activated the very first time the 
*/
export function activate( context : vscode.ExtensionContext ) {

    const rootPath = vscode.workspace.rootPath;

    /* -- Make Hidden Classes -- */
    const utilities = new Utilities( context );
    const excludeItemsController = new ExcludeItemsController( utilities );

    /* --------------------
     * Hide item cmd
     * ---------------------------------------------------------------
     * invoke MH.hide_item to hide the file
     * ---------------------------------------------------------------
     * Executed from: Command pallet, Context menu
    */
    let hideItem = vscode.commands.registerCommand('make-hidden.hideItem', ( e : any ) =>  {
        /* -- Executed from context menu -- */
        if( is_vs_file_object( e ) )
        {
            let file_name : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            excludeItemsController.hideItem( file_name );
        }

        /* -- Executed from vs-code command pallet -- */
        else if( e == undefined )
        {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : "This will hide the file from the project's directory.",
                placeHolder : "Enter file name filename",
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( file_name : string ) =>  {
                excludeItemsController.hideItem( file_name );
            });
        }
    });

    /* --------------------
     * --
     * ---------------------------------------------------------------
     * --
     * ---------------------------------------------------------------
     * --
    */
    let superHide = vscode.commands.registerCommand('make-hidden.superHide', ( e : any ) =>   {

        let hideByOptions: string[] = [
            `By Name`, `By Extension`,
        ];

        let hideLevelOptions: string[] = [
            `Globally: Hide from root dir`,
            `Current: Hide from current dir`,
            `Current & Below: Hide from current dir & lower`,
            `Below: Hide all from below here`
        ];

        /* -- Executed from context menu -- */
        if( is_vs_file_object( e ) )
        {
            vscode.window.showQuickPick( hideByOptions )
            .then( ( hideBySelection : string ) => {
                
                let hideByType: boolean = ( hideByOptions.indexOf( hideBySelection ) > 0 )? true : false;

                vscode.window.showQuickPick( hideLevelOptions )
                .then( ( val : string ) => {
                    let itemPath: string =  e.fsPath.replace( rootPath , '' ).slice( 1 );
                    let hideLevel: number = hideLevelOptions.indexOf( val );
                    excludeItemsController.hideItems( itemPath, hideByType, hideLevel );
                } );
            } );
        }
    });

    /* --------------------
     * Remove Item
     * ---------------------------------------------------------------
     * Executed from: Explorer view item click
    */
    let removeItem = vscode.commands.registerCommand('make-hidden.removeItem', ( exludeString : string ) =>  {
        /* -- Executed from vs-code command pallet -- */
        if( exludeString == undefined ) {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : `Removes an item from the config list`,
                placeHolder : `Type the name of the item you want to remove.`,
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( exludeStringInput : string ) => {
                excludeItemsController.removeItem( exludeStringInput );
            });
        }

        else {
            excludeItemsController.removeItem( exludeString );
        }
    });

    /* --------------------
     * Show all items in list
     * ---------------------------------------------------------------
     * Invokes MH.remove_all_regex_items_from_config_list to empty the list out on the current config setting
     * ---------------------------------------------------------------
     * Executed from: Command pallet, explorer view menu
    */
    let emptyConfig = vscode.commands.registerCommand('make-hidden.removeAllItems', ( item_key : string ) => {
        //TODO: Find a way to refresh this.
        excludeItemsController.removeAllItems();
    });

    /* --------------------
     * Subscribe commands
    */
    // -- hide
    context.subscriptions.push( hideItem );
    context.subscriptions.push( superHide );
    // -- Show
    context.subscriptions.push( removeItem );
    context.subscriptions.push( emptyConfig );
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Just checking to see if we have a valid file object
function is_vs_file_object( obj : any = null ) : boolean
{
    if( typeof obj == 'object' )
    {
        for ( let prop in obj ) 
        {
            if( prop == 'fsPath')
            {
                return true;
            }
        }
    }

    return false;
}