'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
// import * as console from 'console';
import * as Util from './make-hidden/utilities';
import ExcludeItems from './make-hidden/ExcludeItems/ExcludeItems.controller';
import { WorkspaceManager, WorkspaceLayout } from './make-hidden/ExcludeItems/ExcludeItems.workspaces';

// Const
const ROOT_PATH = vscode.workspace.rootPath;
const PLUGIN_NAME = 'makeHidden';

/* --------------------
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the
*/
export function activate(context: vscode.ExtensionContext) {
  const workspaceManager = new WorkspaceManager(Util.getExtensionSettingPath());
  const excludeItems = new ExcludeItems();

  /* -- Set vs code context -- */
  Util.setVsCodeContext(context);

  /* --------------------
   * Hide Cmd's
  */
  ['hideItem', 'superHide', 'showOnly'].forEach((cmd:string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, (e: any) => {
      if (settingsFileExists() && e.fsPath) {
        let fileName: string = e.fsPath.replace(ROOT_PATH, '').slice(1);
        switch (cmd) {
          case 'hideItem' : {
            excludeItems.hideItem(fileName);
            break;
          }

          case 'superHide': {
            let hideByOptions: string[] = [`Matching name`, `Matching extension`];
            let hideLevelOptions: string[] = [
                `Root directory`,
                `Current directory`,
                `Current & Child directories`,
                `Child directories only`
            ];

            vscode.window.showQuickPick(hideByOptions).then((hideBySelection: string) => {
                let hideByType: boolean = (hideByOptions.indexOf(hideBySelection) > 0) ? true : false;
                vscode.window.showQuickPick(hideLevelOptions).then((val: string) => {
                    let itemPath: string = e.fsPath.replace(ROOT_PATH, '').slice(1);
                    let hideLevel: number = hideLevelOptions.indexOf(val);
                    excludeItems.hideItems(itemPath, hideByType, hideLevel);
                });
            });

            break;
          }

          case 'showOnly': {
            excludeItems.showOnly(fileName);
            break;
          }
        }
      }
    });

    context.subscriptions.push(registerCommand);
  });

  /* --------------------
   * Show Cmd's
  */
  ['removeSearch', 'removeItem', 'removeAllItems'].forEach((cmd:string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, (excludeString: string) => {
      switch (cmd) {
        case 'removeSearch': {
          excludeItems.getHiddenItemList().then((excludeList:any) => {
              vscode.window.showQuickPick(excludeList).then((excludeString:string) => {
                if (excludeString) {
                  excludeItems.makeVisible(excludeString);
                  vscode.commands.executeCommand('make-hidden.removeSearch');
                }
              });
          });
          break;
        }

        case 'removeItem': {
          if (typeof excludeString == 'string' && excludeString.length > 0) {
            excludeItems.makeVisible(excludeString);
          }
          break;
        }

        case 'removeAllItems': {
          excludeItems.showAllItems();
          break;
        }
      }
    });

    context.subscriptions.push(registerCommand);
  });

  /* --------------------
   * Workspace Cmd's
  */
  ['workspaceSave', 'workspaceLoad', 'workspaceDelete'].forEach((cmd:string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, () => {
      let workspaces: WorkspaceLayout[] = workspaceManager.getAll();
      let workspaceList: string[] = [];
      let workspaceIdsList: string[] = [];

      workspaces.forEach((workspace: any = {}) => {
        let path: string = workspace.path;
        if (path == null || path == Util.getVsCodeCurrentPath()) {
          let label: string = ((path === null) ? 'G: ' : '') + `${workspace.name}`;
          workspaceList.push(label);
          workspaceIdsList.push(workspace.id);
        }
      });
      workspaceList.push('Close');

      switch (cmd) {
        case 'workspaceSave': {
          vscode.window.showQuickPick(['Globally', 'Current working directory', 'Close']).then((choice) => {
            if (choice === 'Close' || choice === undefined) return;
            vscode.window.showInputBox({ prompt: 'Name of Workspace' }).then((workspaceName: string) => {
              if (workspaceName === undefined) return;
              excludeItems.getHiddenItemList().then((excludeItems: string[]) => {
                let type: string = (choice === 'Globally') ? null : Util.getVsCodeCurrentPath();
                workspaceManager.create(workspaceName, excludeItems, type);
              })
            });
          });
          break;
        }

        case 'workspaceLoad': {
          vscode.window.showQuickPick(workspaceList).then((val: string) => {
            if (val === 'Close' || val === undefined) return;
            let chosenWorkspaceId = workspaceIdsList[workspaceList.indexOf(val)];
            let chosenWorkspace = workspaceManager.fidById(chosenWorkspaceId);
            excludeItems.loadExcludedList(chosenWorkspace['excludedItems']);
          });
          break;
        }

        case 'workspaceDelete': {
          vscode.window.showQuickPick(workspaceList).then((val: string) => {
            if (val === 'Close' || val === undefined) return;
            let chosenWorkspaceId = workspaceIdsList[workspaceList.indexOf(val)];
            workspaceManager.removeById(chosenWorkspaceId);
          });
          break;
        }
      }
    });
    context.subscriptions.push(registerCommand);
  });
}

export function deactivate() {
}

function settingsFileExists() {
  const codeSettingsFileExists: boolean = Util.fileExists(`${Util.getVsCodeCurrentPath()}/.vscode/settings.json`);
  if(codeSettingsFileExists) {
    return true;
  } else {
    Util.createVscodeSettingJson();
    return false;
  }
}