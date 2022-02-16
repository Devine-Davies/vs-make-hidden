import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { map, switchMap, take, tap } from "rxjs/operators";
import { combineLatest, from, Observable, of, throwError } from "rxjs";
import * as Util from "./MakeHidden/utilities";
import { ExcludeItems, Workspaces, Workspace } from "./MakeHidden/classes";
import { AllItemsInDirectory } from "./MakeHidden/service";

/**
 * Extension activation
 * Vscode Plugin Lifecycle: activate
 * @param context
 */
export const activate = (context: vscode.ExtensionContext) => {
  const workspaceManager = new Workspaces(Util.getExtensionSettingPath());
  const excludeItems = new ExcludeItems();

  // Set vs code context
  Util.setVsCodeContext(context);

  /**
   * Hide Cmd's
   */
  ["hide", "hide.multiple", "hide.many", "show.only"].forEach((cmd: string) => {
    const registerCommand = vscode.commands.registerCommand(
      `make-hidden.${cmd}`,
      (e: any) => {
        if (!settingsFileExists() || !e.fsPath) {
          createVscodeSettingJson$().subscribe(() =>
            displayVsCodeMessage(
              "Settings created, try that action again 👍",
              true
            )
          );
        }

        // @Todo: make this work for multi workspaces
        const rootPath = Util.getVsCodeCurrentPath();
        const chosenFilePath: string = e.fsPath;
        const relativePath = path.relative(rootPath, chosenFilePath);
        const dirName = path.dirname(chosenFilePath);
        const fileName = path.basename(chosenFilePath);
        const extension = path.extname(fileName);

        switch (cmd) {
          case "hide": {
            excludeItems.hide$(relativePath).pipe(take(1)).subscribe();
            break;
          }

          case "hide.multiple": {
            AllItemsInDirectory(dirName)
              .pipe(
                switchMap((items) =>
                  vscode.window.showQuickPick(items, {
                    placeHolder: "Choose the items you wish to hide",
                    canPickMany: true,
                  })
                ),
                switchMap((selected) => {
                  const relativePaths = selected.map(
                    (name) =>
                      `${Util.getVsCodeCurrentPath().replace(
                        `${dirName}/`,
                        ""
                      )}/${name}`
                  );
                  return excludeItems.hideMultiple$(relativePaths);
                }),
                take(1)
              )
              .subscribe({
                error: (error) =>
                  handelProcessError(error, `Sorry, something went wrong!`),
              });
            break;
          }

          case "hide.many": {
            fs.lstat(chosenFilePath, (err, stats) => {
              const firstPrompt$ = (
                fileName: string,
                extension: string,
                isFile: boolean
              ): Observable<number> => {
                if (!isFile) return of(0);
                const hideByOptions = [
                  `By Name: ${fileName}`,
                  `By Extension: ${extension}`,
                ];
                return from(vscode.window.showQuickPick(hideByOptions)).pipe(
                  switchMap((val) =>
                    !!val ? of(val) : throwError(() => new Error("silent"))
                  ),
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
                  switchMap((val) =>
                    !!val ? of(val) : throwError(() => new Error("silent"))
                  ),
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
                .subscribe({
                  error: (error) =>
                    handelProcessError(error, `Sorry, something went wrong!`),
                });
            });
            break;
          }

          case "show.only": {
            excludeItems.showOnly$(relativePath).pipe(take(1)).subscribe();
            break;
          }
        }
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
                    !!name ? of(name) : throwError(() => new Error("silent"))
                  )
                );

              excludeItems
                .getHiddenItemList$()
                .pipe(
                  switchMap(prompt$),
                  switchMap(excludeItems.makeVisible$),
                  take(1)
                )
                .subscribe({
                  error: () =>
                    handelProcessError(
                      new Error("Sorry, something went wrong")
                    ),
                });
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
              excludeItems.undo$().subscribe();
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
              switchMap((name) =>
                !!name ? of(name) : throwError(() => new Error("silent"))
              )
            );

          switch (cmd) {
            case "workspace.create": {
              const prompt$ = from(
                vscode.window.showInputBox({
                  prompt: "Enter workspace name",
                })
              ).pipe(
                switchMap((name) =>
                  !!name ? of(name) : throwError(() => new Error("silent"))
                )
              );

              prompt$
                .pipe(
                  switchMap((name) =>
                    excludeItems
                      .getHiddenItemList$()
                      .pipe(
                        switchMap((excludeItems) =>
                          workspaceManager
                            .create$(name, excludeItems, null)
                            .pipe(map(() => name))
                        )
                      )
                  ),
                  take(1)
                )
                .subscribe({
                  error: (error) => handelProcessError(error, `Error removing`),
                  next: (name) =>
                    displayVsCodeMessage(`Created ${name} workspace`),
                });
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
                  switchMap(({ id, name }) =>
                    workspaceManager.removeById$(id).pipe(map(() => name))
                  ),
                  take(1)
                )
                .subscribe({
                  error: (error) => handelProcessError(error, `Error removing`),
                  next: (name) =>
                    displayVsCodeMessage(`Deleted ${name} Workspace`),
                });
              break;
            }

            case "workspace.load": {
              workspaceManager
                .getWorkspacesWithPath$([null, Util.getVsCodeCurrentPath()])
                .pipe(
                  switchMap((workspaces) => workspaceListPrompt$(workspaces)),
                  switchMap((chosenSpace) =>
                    workspaceManager.getWorkspaceByName$(chosenSpace)
                  ),
                  switchMap(({ name, excludedItems }) =>
                    excludeItems
                      .loadExcludedList$(excludedItems)
                      .pipe(map(() => name))
                  ),
                  take(1)
                )
                .subscribe({
                  error: (error) => handelProcessError(error),
                  next: (name) =>
                    displayVsCodeMessage(`Workspace ${name} Loaded`),
                });
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
 * Extension deactivate
 * Vscode Plugin Lifecycle: deactivate
 */
export const deactivate = () => {};

/**
 * Handel Process Errors
 * @param error
 * @param fallbackMsg
 */
const handelProcessError = (
  error: Error,
  fallback = "Sorry, Something went wrong"
) =>
  error.message === "silent" ? null : vscode.window.showErrorMessage(fallback);

/**
 * Helper function for VS Code quick message
 * @param error
 */
const displayVsCodeMessage = (msg: string, bar = true) =>
  bar
    ? vscode.window.setStatusBarMessage(msg)
    : vscode.window.showInformationMessage(msg);

/**
 *
 * @returns
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
 * @returns
 */
const settingsFileExists = (): boolean =>
  Util.fileExists(`${Util.getVsCodeCurrentPath()}/.vscode/settings.json`);

/**
 * Goes thought the process of asking and crating a vs code settings file
 */
export const createVscodeSettingJson$ = (): Observable<any> => {
  const noticeText = `No vscode/settings.json found, create now`;
  const grantedText = "Create";
  const { path, full } = Util.getVscodeSettingPath();
  return from(
    vscode.window.showInformationMessage(noticeText, grantedText)
  ).pipe(
    switchMap((selection) =>
      selection === grantedText ? of(selection) : throwError("silent")
    ),
    tap(() => {
      fs.mkdir(path, (e) => {
        fs.writeFile(full, JSON.stringify({}), (err) =>
          err
            ? handelProcessError(
                new Error(`Error creating .vscode/settings.json`)
              )
            : null
        );
      });
    })
  );
};
