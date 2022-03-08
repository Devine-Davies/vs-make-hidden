import * as vscode from "vscode";
import * as fs from "fs";
import * as Util from "./MakeHidden/utilities";
import { catchError, map, switchMap, take, tap } from "rxjs/operators";
import { from, Observable, of, throwError } from "rxjs";
import { ExcludeItems, Workspaces, Workspace } from "./MakeHidden/Classes";
import {
  AllItemsInDirectory,
  MakeFileAsync,
  SaveFileAsync,
  PathExistsAsync,
} from "./MakeHidden/Service";

/**
 * Extension activation
 * Vscode Plugin Lifecycle: activate
 * @param context
 */
export const activate = (context: vscode.ExtensionContext) => {
  const cmdPrefix = "make-hidden";
  const workspaceManager = new Workspaces(Util.getExtensionSettingPath());
  const excludeItems = new ExcludeItems();

  Util.setVsCodeContext(context);

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

  const hide = vscode.commands.registerCommand(
    `${cmdPrefix}.hide`,
    (e: any) => {
      Util.displayVsCodeMessage(JSON.stringify(e), false);
      const { relativePath } = Util.buildPathObject(e.fsPath);

      settingFileExists$()
        .pipe(
          switchMap(() => excludeItems.hide$(relativePath)),
          take(1)
        )
        .subscribe();
    }
  );

  const hideMultiple = vscode.commands.registerCommand(
    `${cmdPrefix}.hide.multiple`,
    (e: any) => {
      const { rootPath, dirName } = Util.buildPathObject(e.fsPath);
      const prompt$ = (items): Observable<string[]> =>
        from(
          vscode.window.showQuickPick(items, {
            placeHolder: "Choose the items you wish to hide",
            canPickMany: true,
          })
        ).pipe(switchMap(silentlyFailIfEmpty$));

      const buildRelativePaths = (items) =>
        items.map((name) =>
          `${dirName.replace(`${rootPath}`, "")}/${name}`.substring(1)
        );

      const hideMultiple$ = AllItemsInDirectory(dirName).pipe(
        switchMap(prompt$),
        map(buildRelativePaths),
        switchMap((relativePaths) => excludeItems.hideMultiple$(relativePaths)),
        take(1)
      );

      settingFileExists$()
        .pipe(switchMap(() => hideMultiple$))
        .subscribe({
          error: (error) =>
            Util.handelError(error, `Sorry, something went wrong!`),
        });
    }
  );

  const hideBy = vscode.commands.registerCommand(
    `${cmdPrefix}.hide.by`,
    ({ fsPath }: any) => {
      const { relativePath, name, extension } = Util.buildPathObject(fsPath);
      const hideByOptions = [
        `By Name {${name}}`,
        `By Extension {${extension}}`,
      ];

      const hideLevelOptions = [
        `From Root`,
        `From Current Directory`,
        `From Current&Child Directories`,
        `From Child Directories`,
      ];

      const firstPrompt$ = (extension: string): Observable<number> =>
        !extension
          ? of(0)
          : from(vscode.window.showQuickPick(hideByOptions)).pipe(
              switchMap(silentlyFailIfEmpty$),
              map((selection) => hideByOptions.indexOf(selection))
            );

      const secondPrompt$ = (by: number): Observable<number> =>
        from(
          vscode.window.showQuickPick(hideLevelOptions, {
            placeHolder: `${hideByOptions[by]}`,
          })
        ).pipe(
          switchMap(silentlyFailIfEmpty$),
          map((val) => hideLevelOptions.indexOf(val))
        );

      const showPrompts$: Observable<{
        hideByOption: boolean;
        hideLevelIndex: number;
      }> = firstPrompt$(extension).pipe(
        switchMap((hideByOption) =>
          secondPrompt$(hideByOption).pipe(
            map((hideLevelIndex) => ({
              hideByOption: hideByOption > 0 ? true : false,
              hideLevelIndex,
            }))
          )
        )
      );

      settingFileExists$()
        .pipe(
          switchMap(() => showPrompts$),
          switchMap(({ hideByOption, hideLevelIndex }) =>
            excludeItems.hideMany$(relativePath, hideByOption, hideLevelIndex)
          ),
          take(1)
        )
        .subscribe({
          error: (error) =>
            Util.handelError(error, `Sorry, something went wrong!`),
        });
    }
  );

  const showOnly = vscode.commands.registerCommand(
    `${cmdPrefix}.show.only`,
    (e: any) => {
      const { relativePath } = Util.buildPathObject(e.fsPath);
      settingFileExists$()
        .pipe(
          switchMap(() => excludeItems.showOnly$(relativePath)),
          take(1)
        )
        .subscribe();
    }
  );

  const removeSearch = vscode.commands.registerCommand(
    `${cmdPrefix}.remove.search`,
    () => {
      const prompt$ = (items: string[]): Observable<string> =>
        items.length
          ? from(
              vscode.window.showQuickPick(items, {
                placeHolder: "Type to quick find",
              })
            ).pipe(switchMap(silentlyFailIfEmpty$))
          : throwError(() => new Error("silent"));

      const makeVisible$ = (item: string) => excludeItems.makeVisible$(item);

      excludeItems
        .getHiddenItemList$()
        .pipe(switchMap(prompt$), switchMap(makeVisible$), take(1))
        .subscribe({
          error: (error) => Util.handelError(error, `Error removing`),
        });
    }
  );

  const removeItem = vscode.commands.registerCommand(
    `${cmdPrefix}.remove.item`,
    (excludeString: string) => {
      excludeItems.makeVisible$(excludeString).pipe(take(1)).subscribe();
    }
  );

  const removeAll = vscode.commands.registerCommand(
    `${cmdPrefix}.remove.all`,
    () => {
      excludeItems.showAllItems$().pipe(take(1)).subscribe();
    }
  );

  const undo = vscode.commands.registerCommand(
    `${cmdPrefix}.remove.undo`,
    () => {
      excludeItems.undo$().subscribe();
    }
  );

  const workspaceMenu = vscode.commands.registerCommand(
    `${cmdPrefix}.workspace`,
    () => {
      const menuItems$ = () =>
        from(
          vscode.window.showQuickPick(["Create", "Load", "Delete"], {
            placeHolder: `What would you like to do...`,
          })
        ).pipe(
          switchMap((name) =>
            !!name
              ? of(name.toLocaleLowerCase())
              : throwError(() => new Error("silent"))
          )
        );

      menuItems$().subscribe({
        next: (cmd) =>
          vscode.commands.executeCommand(`${cmdPrefix}.workspace.${cmd}`),
      });
    }
  );

  const createWorkspace = vscode.commands.registerCommand(
    `${cmdPrefix}.workspace.create`,
    () => {
      const prompt$ = from(
        vscode.window.showInputBox({
          prompt: "Enter name",
        })
      ).pipe(
        switchMap((name) =>
          !!name ? of(name) : throwError(() => new Error("silent"))
        )
      );

      const getItemsAndCreate$ = (name) =>
        excludeItems
          .getHiddenItemList$()
          .pipe(
            switchMap((excludeItems) =>
              workspaceManager.create$(name, excludeItems, null)
            )
          );

      prompt$.pipe(switchMap(getItemsAndCreate$), take(1)).subscribe({
        error: (error) => Util.handelError(error, `Error creating`),
        next: () => Util.displayVsCodeMessage(`Workspace saved`),
      });
    }
  );

  const deleteWorkspace = vscode.commands.registerCommand(
    `${cmdPrefix}.workspace.delete`,
    () => {
      workspaceManager
        .getWorkspacesWithPath$([null, Util.getVsCodeCurrentPath()])
        .pipe(
          switchMap((workspaces) => workspaceListPrompt$(workspaces)),
          switchMap((chosenSpace) => workspaceManager.getByName$(chosenSpace)),
          switchMap(({ id }) => workspaceManager.removeById$(id)),
          take(1)
        )
        .subscribe({
          error: (error) => Util.handelError(error, `Error removing`),
          next: () => Util.displayVsCodeMessage(`Deleted Workspace`),
        });
    }
  );

  const loadWorkspace = vscode.commands.registerCommand(
    `${cmdPrefix}.workspace.load`,
    () => {
      workspaceManager
        .getWorkspacesWithPath$([null, Util.getVsCodeCurrentPath()])
        .pipe(
          switchMap((workspaces) => workspaceListPrompt$(workspaces)),
          switchMap((chosenSpace) => workspaceManager.getByName$(chosenSpace)),
          switchMap(({ name, excludedItems }) =>
            excludeItems.loadExcludedList$(excludedItems).pipe(map(() => name))
          ),
          take(1)
        )
        .subscribe({
          error: (error) => Util.handelError(error),
          next: (name) => Util.displayVsCodeMessage(`Workspace ${name} Loaded`),
        });
    }
  );

  [
    /**
     * Hide commands
     */
    hide,
    hideMultiple,
    hideBy,
    showOnly,
    /**
     * Show commands
     */
    removeSearch,
    removeItem,
    removeAll,
    undo,
    /**
     * Workspace commands
     */
    workspaceMenu,
    createWorkspace,
    deleteWorkspace,
    loadWorkspace,
  ].map((cmd) => context.subscriptions.push(cmd));
};

/**
 * Extension deactivate
 * Vscode Plugin Lifecycle: deactivate
 */
export const deactivate = () => {};

/**
 *
 * @param val
 * @returns
 */
const silentlyFailIfEmpty$ = (val: any): Observable<any | Error> =>
  !!val ? of(val) : throwError(() => new Error("silent"));

/**
 *
 * @returns
 */
const settingFileExists$ = () =>
  PathExistsAsync(Util.getVscodeSettingPath().full).pipe(
    catchError(() => createSettingPrompt$())
  );

/**
 * Prompts the user to create setting file
 * @returns
 */
export const createSettingPrompt$ = (): Observable<any> => {
  const { path, full } = Util.getVscodeSettingPath();
  Util.displayVsCodeMessage(JSON.stringify(Util.getVscodeSettingPath()), false);
  return from(
    vscode.window.showInformationMessage(
      `No vscode/settings.json found, create now`,
      "Create"
    )
  ).pipe(
    switchMap(silentlyFailIfEmpty$),
    switchMap(() =>
      PathExistsAsync(path).pipe(catchError(() => MakeFileAsync(path)))
    ),
    switchMap(() => SaveFileAsync(full, JSON.stringify({}))),
    tap(() => Util.displayVsCodeMessage("Settings created", true))
  );
};
