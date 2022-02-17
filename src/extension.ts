import * as vscode from "vscode";
import * as fs from "fs";
import * as Util from "./MakeHidden/utilities";
import { map, switchMap, take, tap } from "rxjs/operators";
import { from, Observable, of, throwError } from "rxjs";
import { ExcludeItems, Workspaces, Workspace } from "./MakeHidden/classes";
import { AllItemsInDirectory } from "./MakeHidden/service";

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

  const settingFileExists$ = () =>
    of(Util.settingsFileExists()).pipe(
      switchMap((exists) =>
        !exists
          ? createVscodeSettingJson$().pipe(
              tap(() => Util.displayVsCodeMessage("Settings created", true))
            )
          : of(exists)
      )
    );

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
        ).pipe(
          switchMap((selected) =>
            selected ? of(selected) : throwError(() => new Error("silent"))
          )
        );
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
      const { relativePath, name, extension, chosenFilePath } =
        Util.buildPathObject(fsPath);

      fs.lstat(chosenFilePath, (err, stats) => {
        const firstPrompt$ = (
          name: string,
          extension: string,
          isFile: boolean
        ): Observable<number> => {
          if (!isFile) return of(0);
          const options = [`By Name (${name})`, `By Extension (${extension})`];
          return from(vscode.window.showQuickPick(options)).pipe(
            switchMap((val) =>
              val ? of(val) : throwError(() => new Error("silent"))
            ),
            map((selection) => options.indexOf(selection))
          );
        };

        const secondPrompt$ = (): Observable<number> => {
          const hideLevelOptions = [
            `From Root`,
            `From Current Directory`,
            `From Current&Child Directories`,
            `From Child Directories`,
          ];

          return from(vscode.window.showQuickPick(hideLevelOptions)).pipe(
            switchMap((val) =>
              !!val ? of(val) : throwError(() => new Error("silent"))
            ),
            map((val) => hideLevelOptions.indexOf(val))
          );
        };

        const hideByProcess$ = firstPrompt$(
          name,
          extension,
          stats.isFile()
        ).pipe(
          switchMap((hideByOption) =>
            secondPrompt$().pipe(
              map((hideLevelIndex) => ({
                hideByOption: hideByOption > 0 ? true : false,
                hideLevelIndex,
              }))
            )
          ),
          switchMap(({ hideByOption, hideLevelIndex }) =>
            excludeItems.hideMany$(relativePath, hideByOption, hideLevelIndex)
          )
        );

        settingFileExists$()
          .pipe(
            switchMap(() => hideByProcess$),
            take(1)
          )
          .subscribe({
            error: (error) =>
              Util.handelError(error, `Sorry, something went wrong!`),
          });
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
      const prompt$ = (items) =>
        from(vscode.window.showQuickPick(items)).pipe(
          switchMap((name) =>
            !!name ? of(name) : throwError(() => new Error("silent"))
          )
        );

      excludeItems
        .getHiddenItemList$()
        .pipe(switchMap(prompt$), switchMap(excludeItems.makeVisible$), take(1))
        .subscribe({
          error: () =>
            Util.handelError(new Error("Sorry, something went wrong")),
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
        from(vscode.window.showQuickPick(["Create", "Load", "Delete"])).pipe(
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
        error: (error) => Util.handelError(error, `Error removing`),
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
            ? Util.handelError(
                new Error(`Error creating .vscode/settings.json`)
              )
            : null
        );
      });
    })
  );
};
