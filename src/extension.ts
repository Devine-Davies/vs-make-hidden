import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as Util from "./MakeHidden/utilities";
import { ExcludeItems, Workspaces, Workspace } from "./MakeHidden/classes";
import { map, switchMap, take } from "rxjs/operators";
import { from, Observable, of, throwError } from "rxjs";

/**
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the
 * @param context
 */
export const activate = (context: vscode.ExtensionContext) => {
  const rootPath = vscode.workspace.rootPath;
  const workspaceManager = new Workspaces(Util.getExtensionSettingPath());
  const excludeItems = new ExcludeItems();

  /* -- Set vs code context -- */
  Util.setVsCodeContext(context);

  /**
   * Hide Cmd's
   * Iterate over each of cmd's to have them registered by vs code
   */
  ["hide", "hide.many", "show.only"].forEach((cmd: string) => {
    const registerCommand = vscode.commands.registerCommand(
      `make-hidden.${cmd}`,
      (e: any) => {
        if (!settingsFileExists() && !e.fsPath) return;

        const chosenFilePath: string = e.fsPath;

        fs.lstat(chosenFilePath, (err, stats) => {
          if (err) return;
          const relativePath = path.relative(rootPath, chosenFilePath);
          const fileName = path.basename(e.fsPath);
          const extension = path.extname(fileName);

          switch (cmd) {
            case "hide": {
              excludeItems
                .hide$(relativePath)
                .pipe(take(1))
                .subscribe(() => displayInfoToast("Boom"));
              break;
            }

            case "hide.many": {
              const firstPrompt$ = (
                fileName: string,
                extension: string,
                isFile: boolean
              ): Observable<number> => {
                const hideByOptions: string[] = [`By Name: ${fileName}`];
                if (isFile) hideByOptions.push(`By Extension: ${extension}`);
                return from(vscode.window.showQuickPick(hideByOptions)).pipe(
                  switchMap((val) => (!!val ? of(val) : throwError("silent"))),
                  map((selection) => hideByOptions.indexOf(selection))
                );
              };

              const secondPrompt$ = (): Observable<number> => {
                const hideLevelOptions = [
                  `From root`,
                  `From current directory`,
                  `From current & child directories`,
                  `Child directories only`,
                ];

                return from(vscode.window.showQuickPick(hideLevelOptions)).pipe(
                  switchMap((val) => (!!val ? of(val) : throwError("silent"))),
                  map((val) => hideLevelOptions.indexOf(val))
                );
              };

              firstPrompt$(fileName, extension, stats.isFile())
                .pipe(
                  switchMap((hideByOption) =>
                    secondPrompt$().pipe(
                      map((hideLevelIndex) => ({
                        hideByOption: hideByOption > 0 ? true : false,
                        hideLevelIndex,
                      }))
                    )
                  ),
                  switchMap(({ hideByOption, hideLevelIndex }) =>
                    excludeItems.hideMany$(
                      relativePath,
                      hideByOption,
                      hideLevelIndex
                    )
                  ),
                  take(1)
                )
                .subscribe(
                  () => displayInfoToast("Boom"),
                  (error) =>
                    handelProcessError(error, `Sorry, something went wrong!`)
                );
              break;
            }

            case "show.only": {
              excludeItems
                .showOnly$(relativePath)
                .pipe(take(1))
                .subscribe(() => displayInfoToast("Boom"));
              break;
            }
          }
        });
      }
    );

    context.subscriptions.push(registerCommand);
  });

  /**
   * Show Cmd's
   */
  ["remove.search", "remove.item", "remove.all", "undo"].forEach(
    (cmd: string) => {
      const registerCommand = vscode.commands.registerCommand(
        `make-hidden.${cmd}`,
        (excludeString: string) => {
          switch (cmd) {
            case "remove.search": {
              const prompt$ = (items) =>
                from(vscode.window.showQuickPick(items)).pipe(
                  switchMap((name) =>
                    !!name ? of(name) : throwError("silent")
                  )
                );

              excludeItems
                .getHiddenItemList$()
                .pipe(switchMap(prompt$), switchMap(excludeItems.makeVisible$))
                .subscribe(
                  () => displayInfoToast("boom"),
                  () => handelProcessError("Sorry, something went wrong")
                );
              break;
            }

            case "remove.item": {
              excludeItems
                .makeVisible$(excludeString)
                .pipe(take(1))
                .subscribe();
              break;
            }

            case "remove.all": {
              excludeItems.showAllItems$().pipe(take(1)).subscribe();
              break;
            }

            case "undo": {
              excludeItems.undo();
              break;
            }
          }
        }
      );

      context.subscriptions.push(registerCommand);
    }
  );

  /**
   * Workspace Cmd's
   */
  ["workspace.create", "workspace.load", "workspace.delete"].forEach(
    (cmd: string) => {
      const registerCommand = vscode.commands.registerCommand(
        `make-hidden.${cmd}`,
        () => {
          if (!getPluginSettings()) {
            return;
          }

          const workspaceListPrompt$ = (Workspaces: Workspace[]) =>
            from(
              vscode.window.showQuickPick(
                Workspaces.map(({ name }) => name || "No name")
              )
            ).pipe(
              switchMap((name) => (!!name ? of(name) : throwError("silent")))
            );

          switch (cmd) {
            case "workspace.create": {
              const prompt$ = from(
                vscode.window.showInputBox({
                  prompt: "Enter workspace name",
                })
              ).pipe(
                switchMap((name) => (!!name ? of(name) : throwError("silent")))
              );

              prompt$
                .pipe(
                  switchMap((name) =>
                    excludeItems
                      .getHiddenItemList$()
                      .pipe(
                        switchMap((excludeItems) =>
                          workspaceManager.create$(name, excludeItems, null)
                        )
                      )
                  ),
                  take(1)
                )
                .subscribe(
                  () => displayInfoToast(`Workspace created`),
                  (error) => handelProcessError(error, `Error removing`)
                );
              break;
            }

            case "workspace.delete": {
              workspaceManager
                .getWorkspacesWithPath$([null, Util.getVsCodeCurrentPath()])
                .pipe(
                  take(1),
                  switchMap((workspaces) => workspaceListPrompt$(workspaces)),
                  switchMap((chosenSpace) =>
                    workspaceManager.getWorkspaceByName$(chosenSpace)
                  ),
                  switchMap(({ id }) => workspaceManager.removeById$(id))
                )
                .subscribe(
                  () => displayInfoToast(`Workspace removed`),
                  (error) => handelProcessError(error, `Error removing`)
                );
              break;
            }

            case "workspace.load": {
              workspaceManager
                .getWorkspacesWithPath$([null, Util.getVsCodeCurrentPath()])
                .pipe(
                  switchMap((workspaces) => workspaceListPrompt$(workspaces)),
                  switchMap((chosenSpace) =>
                    workspaceManager.getWorkspaceByName$(chosenSpace)
                  )
                )
                .subscribe(({ excludedItems }) => {
                  console.log(excludedItems);
                  excludeItems.loadExcludedList(excludedItems);
                });

              // vscode.window
              //   .showQuickPick(workspacesNames)
              //   .then((val: string) => {
              //     if (val === "Close" || val === undefined) return;
              //     let chosenWorkspaceId =
              //       workspaceIds[workspacesNames.indexOf(val)];
              //     let chosenWorkspace = workspaces[chosenWorkspaceId];
              //     excludeItems.loadExcludedList(
              //       chosenWorkspace["excludedItems"]
              //     );
              //   });
              break;
            }
          }
        }
      );
      context.subscriptions.push(registerCommand);
    }
  );
};

/**
 *
 * @param error
 * @param fallbackMsg
 * @returns
 */
const handelProcessError = (error, fallback = "Sorry, Something went wrong") =>
  error === "silent" ? null : displayInfoToast(fallback);

/**
 *
 * @param error
 * @param fallbackMsg
 * @returns
 */
const displayInfoToast = (msg) => vscode.window.showInformationMessage(msg);

/**
 *
 */
export const deactivate = () => {};

/**
 *
 */
const getPluginSettings = (): boolean => {
  const fileExists: boolean = Util.fileExists(
    `${Util.getExtensionSettingPath()}`
  );
  if (fileExists) {
    return true;
  } else {
    // Util.createPluginSettingsJson();
    return false;
  }
};

/**
 *
 */
const settingsFileExists = (): boolean => {
  const fileExists: boolean = Util.fileExists(
    `${Util.getVsCodeCurrentPath()}/.vscode/settings.json`
  );
  if (fileExists) {
    return true;
  } else {
    Util.createVscodeSettingJson();
    return false;
  }
};
