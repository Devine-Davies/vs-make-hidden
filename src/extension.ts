import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as Util from "./MakeHidden/utilities";
import { ExcludeItems, Workspaces, Workspace } from "./MakeHidden/classes";
import { map, switchMap, take, tap } from "rxjs/operators";
import { from, Observable, of, throwError } from "rxjs";

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
  ["hide", "hide.many", "show.only"].forEach((cmd: string) => {
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
        const rootPath = Util.getVscodeSettingPath().path;
        const chosenFilePath: string = e.fsPath;
        const relativePath = path.relative(rootPath, chosenFilePath);
        const fileName = path.basename(chosenFilePath);
        const extension = path.extname(fileName);
        switch (cmd) {
          case "hide": {
            excludeItems.hide$(relativePath).pipe(take(1)).subscribe(); //displayVsCodeMessage("Hide complete")
            break;
          }

          case "hide.many": {
            fs.lstat(chosenFilePath, (err, stats) => {
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
                  () => {}, //displayVsCodeMessage("Hide many")
                  (error) =>
                    handelProcessError(error, `Sorry, something went wrong!`)
                );
            });
            break;
          }

          case "show.only": {
            excludeItems.showOnly$(relativePath).pipe(take(1)).subscribe(); //displayVsCodeMessage("Boom")
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
                    !!name ? of(name) : throwError("silent")
                  )
                );

              excludeItems
                .getHiddenItemList$()
                .pipe(switchMap(prompt$), switchMap(excludeItems.makeVisible$))
                .subscribe(
                  () => {}, //displayVsCodeMessage("boom")
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
                          workspaceManager
                            .create$(name, excludeItems, null)
                            .pipe(map(() => name))
                        )
                      )
                  ),
                  take(1)
                )
                .subscribe(
                  (name) => displayVsCodeMessage(`Created ${name} workspace`),
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
                  switchMap(({ id, name }) =>
                    workspaceManager.removeById$(id).pipe(map(() => name))
                  ),
                  take(1)
                )
                .subscribe(
                  (name) => displayVsCodeMessage(`Deleted ${name} Workspace`),
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
                  ),
                  switchMap(({ name, excludedItems }) =>
                    excludeItems
                      .loadExcludedList$(excludedItems)
                      .pipe(map(() => name))
                  ),
                  take(1)
                )
                .subscribe(
                  (name) => displayVsCodeMessage(`Workspace ${name} Loaded`),
                  (error) => handelProcessError(error)
                );
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
const handelProcessError = (error, fallback = "Sorry, Something went wrong") =>
  error === "silent" ? null : vscode.window.showErrorMessage(fallback);

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
            ? handelProcessError(`Error creating .vscode/settings.json`)
            : null
        );
      });
    })
  );
};
