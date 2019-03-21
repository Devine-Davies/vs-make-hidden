import * as vscode from 'vscode';
import * as Util from './MakeHidden/utilities';
import ExcludeItems from './MakeHidden/Classes/ExcludeItems/ExcludeItems.class';
import { Workspaces, Workspace } from './MakeHidden/Classes/Workspaces/Workspaces.class';

// Const
const ROOT_PATH = vscode.workspace.rootPath;
const PLUGIN_NAME = 'MakeHidden';

/* --------------------
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the
*/
export function activate(context: vscode.ExtensionContext) {
  const workspaceManager = new Workspaces();
  const excludeItems = new ExcludeItems();

  /* -- Set vs code context -- */
  Util.setVsCodeContext(context);

  /* --------------------
   * Hide Cmd's
  */
  ['hideItem', 'superHide', 'showOnly', 'undo'].forEach((cmd: string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, (e: any) => {
      if (!settingsFileExists() && !e.fsPath) {
        return;
      }

      let fileName: string = e.fsPath.replace(ROOT_PATH, '').slice(1);
      switch (cmd) {
        case 'hideItem': {
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

        case 'undo': {
          excludeItems.undo();
          break;
        }
      }
    });

    context.subscriptions.push(registerCommand);
  });

  /* --------------------
   * Show Cmd's
  */
  ['removeSearch', 'removeItem', 'removeAllItems'].forEach((cmd: string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, (excludeString: string) => {
      switch (cmd) {
        case 'removeSearch': {
          excludeItems.getHiddenItemList().then((excludeList: any) => {
            vscode.window.showQuickPick(excludeList).then((excludeString: string) => {
              if (excludeString) {
                excludeItems.makeVisible(excludeString);
                // TODO: Don't like this fix as it runs before promise showing old list
                setTimeout( () => vscode.commands.executeCommand('make-hidden.removeSearch'), 500);
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
  ['workspace.create', 'workspace.load', 'workspace.delete'].forEach((cmd: string) => {
    let registerCommand = vscode.commands.registerCommand(`make-hidden.${cmd}`, () => {
      if (!pluginSettingsJson()) {
        return;
      }

      workspaceManager.getWorkspaces().then((workspaces: Workspace[]) => {
        let workspaceIds: string[] = Object.keys(workspaces);
        let workspacesNames: string[] = [];

        workspaceIds.map((id: string, i: number) => {
          let workspace: Workspace = workspaces[id];
          let path: string = workspace.path;

          if (path == null || path == Util.getVsCodeCurrentPath()) {
            let label: string = `${i}. ` + `${workspace.name}` + ((path === null) ? ' •' : '');
            workspacesNames.push(label);
          }
        });
        workspacesNames.push('Close');

        switch (cmd) {
          case 'workspace.create': {
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

          case 'workspace.load': {
            vscode.window.showQuickPick(workspacesNames).then((val: string) => {
              if (val === 'Close' || val === undefined) return;
              let chosenWorkspaceId = workspaceIds[workspacesNames.indexOf(val)];
              let chosenWorkspace = workspaces[chosenWorkspaceId];
              excludeItems.loadExcludedList(chosenWorkspace['excludedItems']);
            });
            break;
          }

          case 'workspace.delete': {
            vscode.window.showQuickPick(workspacesNames).then((val: string) => {
              if (val === 'Close' || val === undefined) return;
              let chosenWorkspaceId = workspaceIds[workspacesNames.indexOf(val)];
              workspaceManager.removeById(chosenWorkspaceId);
            });
            break;
          }
        }
      });
    });
    context.subscriptions.push(registerCommand);
  });
}

export function deactivate() {
}

function pluginSettingsJson(): boolean {
  const codeSettingsFileExists: boolean = Util.fileExists(`${Util.getExtensionSettingPath()}`);
  if (codeSettingsFileExists) {
    return true;
  } else {
    Util.createPluginSettingsJson();
    return false;
  }
}

function settingsFileExists(): boolean {
  const codeSettingsFileExists: boolean = Util.fileExists(`${Util.getVsCodeCurrentPath()}/.vscode/settings.json`);
  if (codeSettingsFileExists) {
    return true;
  } else {
    Util.createVscodeSettingJson();
    return false;
  }
}