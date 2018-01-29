'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as console from 'console';
import * as path from 'path';

/* -- Make hidden lib's -- */
import * as Util from './make-hidden/utilities';
import ExcludeItemsController from './make-hidden/exclude-items/exclude-items.controller';
import WorkspaceManager from './make-hidden/workspace-manager/workspace-manager.controller';

// Const
const ROOT_PATH = vscode.workspace.rootPath;
const PLUGIN_NAME = 'makeHidden';

/* --------------------
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the
*/
export function activate( context : vscode.ExtensionContext ) {
    const excludeItemsController = new ExcludeItemsController();
    const workspaceManager = new WorkspaceManager(
        Util.getExtensionSettingPath()
    );

    /* -- Set vs code context -- */
    Util.setVsCodeContext(context);

    /* --------------------
     * Hide Cmd's
    */
    ['hideItem', 'superHide', 'showOnly'].forEach( ( cmd ) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, ( e : any ) =>  {
            if( ! Util.isVsCodeFileObject( e ) ) { return; }
            switch( cmd ){
                case 'hideItem' :
                    let file_name : string = e.fsPath.replace( ROOT_PATH , '' ).slice( 1 );
                    excludeItemsController.hideItem( file_name );
                break;

                case 'superHide' :
                    excludeItemsController.superHide( e, ROOT_PATH );
                break;

                case 'showOnly' :
                    let fileName : string = e.fsPath.replace( ROOT_PATH , '' ).slice( 1 );
                    excludeItemsController.showOnly( fileName );
                break;
            }
        })
        context.subscriptions.push( registerCommand );
    });

    /* --------------------
     * Show Cmd's
    */
    ['removeItem', 'removeAllItems'].forEach( ( cmd ) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, ( excludeString : string ) =>  {
            switch( cmd ){
                case 'removeItem' :
                    if( typeof excludeString == 'string' && excludeString.length > 0 ) {
                        excludeItemsController.removeItem( excludeString );
                    }
                break;

                case 'removeAllItems' :
                    excludeItemsController.removeAllItems();
                break;
            }
        });
        context.subscriptions.push( registerCommand );
    });

    /* --------------------
     * Workspace Cmd's
    */
    ['workspaceSave', 'workspaceLoad', 'workspaceDelete'].forEach( ( workspaceCmd ) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${workspaceCmd}`, () => {

            let workspaces = workspaceManager.getAll();
            let workspaceList: string[] = [];
            let workspaceIdsList: string[] = [];

            workspaces.forEach( ( workspace: any = {} ) => {
                let label: string = null;
                if( workspace.path == 'global' ){
                    label = `${workspace.name} (G)`;
                } else if ( workspace.path == Util.getVsCodeCurrentPath() ){
                    label = `${workspace.name}`;
                }
                if( label !== null ){
                    workspaceList.push( label );
                    workspaceIdsList.push( workspace.id );
                }
            } );

            workspaceList.sort();
            workspaceList.push('Close');

            switch( workspaceCmd ){
                case 'workspaceSave' :
                    let workspaceChoices: string[] = ['Globally', 'Current working directory', 'Close'];
                    vscode.window.showQuickPick( workspaceChoices )
                    .then( ( choice ) => {
                        if( choice === 'Close' ) return;
                        vscode.window.showInputBox({prompt: 'Name of Workspace'})
                        .then( ( workspaceName: string ) => {
                            if( workspaceName !== undefined ){
                                let excludeItems: any = excludeItemsController.getFilesExcludeObject();
                                if( choice === 'Globally' ){
                                    workspaceManager.create( workspaceName, excludeItems );
                                }
                                else if( choice === 'Current working directory' ) {
                                    workspaceManager.create( workspaceName, excludeItems, Util.getVsCodeCurrentPath() );
                                }
                            }
                        });
                    });
                break;

                case 'workspaceLoad' :
                    vscode.window.showQuickPick( workspaceList )
                    .then( ( val: string ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceId = workspaceIdsList[ workspaceList.indexOf( val ) ];
                        let chosenWorkspace = workspaceManager.fidById( chosenWorkspaceId );
                        if( chosenWorkspace ){
                            excludeItemsController.loadList( chosenWorkspace['excludedItems'] )
                        }
                    });
                break;

                case 'workspaceDelete' :
                    vscode.window.showQuickPick( workspaceList )
                    .then( ( val: string ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceId = workspaceIdsList[ workspaceList.indexOf( val ) ];
                        if( chosenWorkspaceId !== undefined ){
                            workspaceManager.removeById( chosenWorkspaceId );
                        }
                    });
                break;
            }
        });
        context.subscriptions.push( registerCommand );
    });
}

export function deactivate() {
}