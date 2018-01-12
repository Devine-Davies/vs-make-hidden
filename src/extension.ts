'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as console from 'console';
import * as path from 'path';

/* -- Make hidden lib's -- */
import Utilities from './make-hidden/utilities';
import ExcludeItemsController from './make-hidden/exclude-items/exclude-items.controller';
import { connect } from 'net';
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
     * Called on 
    */
    let hideItem = vscode.commands.registerCommand('make-hidden.hideItem', ( e : any ) =>  {
        if( isVscodeFileObject( e ) ) {
            let file_name : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            excludeItemsController.hideItem( file_name );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Hide Item in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let superHide = vscode.commands.registerCommand('make-hidden.superHide', ( e : any ) =>   {
        if( isVscodeFileObject( e ) ) {
            excludeItemsController.superHide( e, rootPath );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Super Hide in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let showOnly = vscode.commands.registerCommand('make-hidden.showOnly', ( e : any ) =>  {
        if( isVscodeFileObject( e ) ) {
            let fileName : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            excludeItemsController.showOnly( fileName );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Hide Item in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let removeItem = vscode.commands.registerCommand('make-hidden.removeItem', ( excludeString : string ) =>  {
        if( typeof excludeString == 'string' ) {
            if( excludeString.length > 0 ){
                excludeItemsController.removeItem( excludeString );
            }
        }
        else {
            let msg: string = `MH: Please select an item from the view pane 'Hidden in Directory'`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let emptyConfig = vscode.commands.registerCommand('make-hidden.removeAllItems', () => {
        excludeItemsController.removeAllItems();
    });

    /* -- Subscribe commands -- */
    // -- hide
    context.subscriptions.push( hideItem );
    context.subscriptions.push( superHide );
    context.subscriptions.push( showOnly );
    // -- Show
    context.subscriptions.push( removeItem );
    context.subscriptions.push( emptyConfig );
}

// this method is called when your extension is deactivated
export function deactivate() {
}


function isVscodeFileObject( obj : any = null ) : boolean {
    if( typeof obj == 'object' ) {
        for ( let prop in obj )  {
            if( prop == 'fsPath') {
                return true;
            }
        }
    }

    return false;
}