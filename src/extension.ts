// https://code.visualstudio.com/docs/extensionAPI/vscode-api
// https://code.visualstudio.com/docs/extensionAPI/vscode-api-commands


// TODO Terminal lynx count all find json
// Count all from root
// $ find */**/**.json  -type f | wc -l

// Count all in folder
// $ find src/**/**.ts  -type f | wc -l
// Add to node child process.

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// visual Studio Code
import * as vscode from 'vscode';

// Node processes
// import * as cp from 'child_process';
// import ChildProcess = cp.ChildProcess;

import MakeHiddenController from './make-hidden/make-hidden.controller';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const rootPath = vscode.workspace.rootPath;

    /* -- Create a new instance of make hidden -- */
    const MH = new MakeHiddenController(context);

    // Assign our MH to VS window tree provider
    vscode.window.registerTreeDataProvider('makeHiddenViewPane', MH);

    MH.onDidChangeTreeData( e => {
    } )

    /* --------------------
     * Hide item cmd
     * ---------------------------------------------------------------
     * invoke MH.hide_item to hide the file
     * ---------------------------------------------------------------
     * Executed from: Command pallet, Context menu
    */
    let hide_item = vscode.commands.registerCommand('makeHidden.hideItem', ( e : any ) => 
    {
        /* -- Executed from context menu -- */
        if( is_vs_file_object( e ) )
        {
            let file_name : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            MH.hide_item( file_name );
        }

        /* -- Executed from vs-code command pallet -- */
        else if( e == undefined )
        {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : "This will hide the file from the project's directory.",
                placeHolder : "Enter file name filename",
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( file_name : string ) => 
            {
                MH.hide_item( file_name );
            });
        }
    });

    /* --------------------
     * Hide extension from root
     * ---------------------------------------------------------------
     * Invoke MH.hide_all_item_with_extension to hide items with the same extension from the
     * projects 'ROOT' directory 
     * ---------------------------------------------------------------
     * Executed from: Command pallet, Context menu
    */
    let hide_extension_from_root = vscode.commands.registerCommand('makeHidden.hideExtensionFromRoot', ( e : any ) => 
    {
        /* -- Executed from context menu -- */
        if( is_vs_file_object( e ) )
        {
            let item_path : string =  e.fsPath.replace( rootPath , '' ).slice( 1 );
            MH.hide_all_extension_types( item_path, true );
        }

        /* -- Executed from vs-code command pallet -- */
        if( e == undefined )
        {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : `This will hide all file that have the same extension from the projects directory.`,
                placeHolder : `Enter extension type`,
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( item_path : string ) => 
            {
                MH.hide_all_extension_types( item_path, true );
            });
        }
    });

    /* --------------------
     * Hide extension from path
     * ---------------------------------------------------------------
     * Invokes MH.hide_all_item_with_extension with tue to hide all items with the same extension from the
     * projects 'ROOT' directory 
     * ---------------------------------------------------------------
     * Executed from: Command pallet, Context menu
    */
    let hide_extension_from_path = vscode.commands.registerCommand('makeHidden.hideExtensionFromDirectory', ( e : any ) => // e : vscode.Uri
    {
        /* -- Executed from context menu -- */
        if( is_vs_file_object( e ) )
        {
            let item_path : string =  e.fsPath.replace( rootPath , '' ).slice( 1 );
            MH.hide_all_extension_types( item_path, false );
        }

        /* -- Executed from vs-code command pallet -- */
        if( e == undefined )
        {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : `Type the out the 'Path' and 'filename' to hide all items with that extension in that directory.`,
                placeHolder : `Enter 'Path' along with item 'filename' and 'extension type'`,
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( item_path : string ) => 
            {
                MH.hide_all_extension_types( item_path, false );
            });
        }
    });

    /* --------------------
     * Remove regex from list
     * ---------------------------------------------------------------
     * Invokes MH.hide_all_item_with_extension with tue to hide all items with the same extension from the
     * projects 'ROOT' directory 
     * ---------------------------------------------------------------
     * Executed from: Command pallet, explorer view item click
    */
    let remove_hidden_regex_from_list = vscode.commands.registerCommand('makeHidden.removeRegexFromList', ( item_key : string ) => 
    {
        /* -- Executed from vs-code command pallet -- */
        if( item_key == undefined )
        {
            let ibo = <vscode.InputBoxOptions> {
                prompt      : `Removes an item from the config list`,
                placeHolder : `Type the name of the item you want to remove.`,
                value       : null
            };

            vscode.window.showInputBox(ibo).then( ( string_input : string ) => 
            {
                MH.remove_regex_from_config_list( string_input );
            });
        }
        else
        {
            MH.remove_regex_from_config_list( item_key );
        }
    });

    /* --------------------
     * Show all items in list
     * ---------------------------------------------------------------
     * Invokes MH.remove_all_regex_items_from_config_list to empty the list out on the current config setting
     * ---------------------------------------------------------------
     * Executed from: Command pallet, explorer view menu
    */
    let empty_config = vscode.commands.registerCommand('makeHidden.emptyItemsInConfig', ( item_key : string ) => 
    {
        //TODO: Find a way to refresh this.
        MH.remove_all_regex_items_from_config_list();
    });

    /* --------------------
     * Refresh item list
     * ---------------------------------------------------------------
     * Invokes MH.remove_all_regex_items_from_config_list to empty the list out on the current config setting
     * ---------------------------------------------------------------
     * Executed from: Command pallet, explorer view menu
    */
    let refresh_item_list = vscode.commands.registerCommand('makeHidden.refreshHiddenList', ( item_key : string ) => 
    {
        //TODO: Find a way to refresh this.
        MH.refresh_list();
    });

    /* --------------------
     * Subscribe commands
    */
    // -- hide
    context.subscriptions.push( hide_item );
    context.subscriptions.push( hide_extension_from_root );
    context.subscriptions.push( hide_extension_from_path );
    // -- Show
    context.subscriptions.push( remove_hidden_regex_from_list );
    context.subscriptions.push( empty_config );
    // -- refresh
    context.subscriptions.push( refresh_item_list );
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