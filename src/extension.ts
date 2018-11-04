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
    const workspaceManager = new WorkspaceManager(Util.getExtensionSettingPath());

    /* -- Set vs code context -- */
    Util.setVsCodeContext(context);

    const statusBarIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);

    /* --------------------
     * Hide Cmd's
    */
    ['hideItem', 'superHide', 'showOnly'].forEach((cmd) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, ( e : any ) =>  {
            if(Util.isVsCodeFileObject(e)) {
                let fileName:string = e.fsPath.replace(ROOT_PATH , '').slice(1);

                switch(cmd) {
                    case 'hideItem' :
                        excludeItemsController.hideItem(fileName);
                    break;

                    case 'superHide' :
                        excludeItemsController.superHide(e, ROOT_PATH);
                    break;

                    case 'showOnly' :
                        excludeItemsController.showOnly(fileName);
                    break;
                }
            }
        })
        context.subscriptions.push(registerCommand);
    });

    /* --------------------
     * Show Cmd's
    */
    ['removeSearch', 'removeItem', 'removeAllItems'].forEach((cmd) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, ( excludeString : string ) =>  {
            switch( cmd ){
                case 'removeSearch' : {
                    let excludeList:any = excludeItemsController.getList();
                    let workspaceChoices:string[] =[];

                    for(let item in excludeList) {
                        workspaceChoices.push(item);
                    }

                    vscode.window.showQuickPick(workspaceChoices).then((excludeString:string) => {
                        if(excludeString !== undefined){
                            excludeItemsController.removeItem( excludeString );
                            vscode.commands.executeCommand('make-hidden.removeSearch');
                        }
                    });
                    break;
                }

                case 'removeItem' : {
                    if(typeof excludeString == 'string' && excludeString.length > 0) {
                        excludeItemsController.removeItem( excludeString );
                    }
                    break;
                }

                case 'removeAllItems' : {
                    excludeItemsController.removeAllItems();
                    break;
                }
            }
        });
        context.subscriptions.push( registerCommand );
    });

    /* --------------------
     * Workspace Cmd's
    */
    ['workspaceSave', 'workspaceLoad', 'workspaceDelete'].forEach((workspaceCmd) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${workspaceCmd}`, () => {

            let workspaces = workspaceManager.getAll();
            let workspaceList: string[] = [];
            let workspaceIdsList: string[] = [];

            workspaces.forEach((workspace: any = {}) => {
                let path:string = workspace.path;
                if(path == 'global' || path == Util.getVsCodeCurrentPath()){
                    let label: string = ((path === 'global')? 'G: ' : '' ) + `${workspace.name}`;
                    workspaceList.push(label);
                    workspaceIdsList.push(workspace.id);
                }
            });
            workspaceList.push('Close');

            switch(workspaceCmd){
                case 'workspaceSave' : {
                    vscode.window.showQuickPick(['Globally', 'Current working directory', 'Close']).then( (choice) => {
                        if(choice === 'Close'|| choice === undefined) return;
                        vscode.window.showInputBox({prompt: 'Name of Workspace'}).then( ( workspaceName: string ) => {
                            if(workspaceName === undefined) return;
                            let excludeItems: any = excludeItemsController.getFilesExcludeObject();
                            let type:string = (choice === 'Globally')? null : Util.getVsCodeCurrentPath();
                            workspaceManager.create(workspaceName, excludeItems, type);
                        });
                    });
                    break;
                }

                case 'workspaceLoad' : {
                    vscode.window.showQuickPick(workspaceList).then((val: string) => {
                        if(val === 'Close'|| val === undefined) return;
                        let chosenWorkspaceId = workspaceIdsList[workspaceList.indexOf(val)];
                        let chosenWorkspace   = workspaceManager.fidById(chosenWorkspaceId);
                        excludeItemsController.loadList(chosenWorkspace['excludedItems']);

                        // statusBarIndicator.command = 'editor.action.commentLine';
                        statusBarIndicator.text = `Hidden Workspace: ${chosenWorkspace.name}`;
                        statusBarIndicator.show();
                        context.subscriptions.push(statusBarIndicator);
                    });
                    break;
                }

                case 'workspaceDelete' : {
                    vscode.window.showQuickPick( workspaceList ).then((val: string) => {
                        if( val === 'Close' || val === undefined ) return;
                        let chosenWorkspaceId = workspaceIdsList[ workspaceList.indexOf( val ) ];
                        workspaceManager.removeById(chosenWorkspaceId);
                    });
                    break;
                }
            }
        });
        context.subscriptions.push( registerCommand );
    });
}

export function deactivate() {
}