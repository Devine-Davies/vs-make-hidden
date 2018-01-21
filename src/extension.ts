'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as console from 'console';
import * as path from 'path';

/* -- Make hidden lib's -- */

import Utilities from './make-hidden/utilities';
import * as Util from './make-hidden/utilities';
import ExcludeItemsController from './make-hidden/exclude-items/exclude-items.controller';
import WorkspaceManager from './make-hidden/workspace-manager/workspace-manager.controller';

const rootPath = vscode.workspace.rootPath;

/* --------------------
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the 
*/
export function activate( context : vscode.ExtensionContext ) {

    /* -- Make Hidden Classes -- */
    const utilities = new Utilities( context );
    const excludeItemsController = new ExcludeItemsController( utilities );
    const workspaceManager = new WorkspaceManager();

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
    // -- Hide
    context.subscriptions.push( hideItem );
    context.subscriptions.push( superHide );
    context.subscriptions.push( showOnly );
    // -- Show
    context.subscriptions.push( removeItem );
    context.subscriptions.push( emptyConfig );

    /* --------------------
     * Called on 
    */
    var workspaceCmdList = ['workspaceSave', 'workspaceLoad', 'workspaceDelete'];
    workspaceCmdList.forEach( ( workspaceCmd ) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${workspaceCmd}`, () => {

            let workspaces = workspaceManager.getAll();
            let workspaceList: string[] = [];
            let workspaceIdsList: string[] = [];

            workspaces.forEach( ( workspace: any = {} ) => {
                let label: string = null;
                if( workspace.path == 'global' ){
                    label = `Global: ${workspace.name}`;
                } else if ( workspace.path == Util.getVsCodeCurrentPath() ){
                    label = `${workspace.name}`;
                }

                if( label !== null ){
                    workspaceList.push( label );
                    workspaceIdsList.push( workspace.id );
                }
            } );

            workspaceList.push('Close');

            switch( workspaceCmd ){
                case 'workspaceSave' : 
                    let workspaceChoices: string[] = ['Save globally', 'Save for current project', 'Close'];
                    vscode.window.showQuickPick( workspaceChoices )
                    .then( ( choice ) => {
                        if( choice === 'Close' ) return;
                        vscode.window.showInputBox({prompt: 'Name of Workspace'})
                        .then( ( workspaceName ) => {
                            workspaceManager.create(
                                workspaceName, workspaceChoices.indexOf( choice ), 
                                excludeItemsController.getFilesExcludeObject()
                            );
                        });
                    });
                break;

                case 'workspaceLoad' :
                    vscode.window.showQuickPick( workspaceList )
                    .then( ( val ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceId = workspaceIdsList[ workspaceList.indexOf( val ) ];
                        let chosenWorkspace = workspaceManager.fidById( chosenWorkspaceId );
                        excludeItemsController.loadList( chosenWorkspace['excludedItems'] )
                    });
                break;

                case 'workspaceDelete' :
                    vscode.window.showQuickPick( workspaceList )
                    .then( ( val ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceId = workspaceIdsList[ workspaceList.indexOf( val ) ];
                        workspaceManager.removeById( chosenWorkspaceId );
                    });
                break;
            }
        });

        context.subscriptions.push( registerCommand );
    })
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
