"use strict";
import * as vscode from "vscode";
import * as Path from "path";
import * as fs from "fs";
import * as os from "os";
import * as process from "process";

let VS_CODE_CONTEXT: any = null;
const HOME_DIR: string = os.homedir();
const PROJECTS_FILE: string = "MakeHidden.json";

export const setVsCodeContext = (context) => {
  VS_CODE_CONTEXT = context;
};

/**
 *
 */
export const getExtensionSettingPath = (): string => {
  let projectFile: string;
  const appData =
    process.env.APPDATA ||
    (process.platform === "darwin"
      ? process.env.HOME + "/Library/Application Support"
      : "/var/local");

  // TODO: find out more about this
  const channelPath: string = "Code";
  // const channelPath: string = this.getChannelPath();

  projectFile = Path.join(appData, channelPath, "User", PROJECTS_FILE);

  if (process.platform === "linux" && !fs.existsSync(projectFile)) {
    projectFile = Path.join(
      HOME_DIR,
      ".config/",
      channelPath,
      "User",
      PROJECTS_FILE
    );
  }

  return projectFile;
};

/**
 *
 */
export const getChannelPath = (): string =>
  vscode.env.appName.indexOf("Insiders") > 0 ? "Code - Insiders" : "Code";

/**
 * @Todo: make this work for multi workspaces
 */
export const getVsCodeCurrentPath = () => {
  return vscode.workspace.workspaceFolders[0].uri.path;
};

/**
 *
 * @param givenPath
 */
export const getPathInfoFromPath = (givenPath: string = null) => {
  let extension: string = Path.extname(givenPath);
  let pathName: string = Path.basename(givenPath);
  return {
    basename: pathName,
    filename:
      extension === "" ? pathName : pathName.slice(0, -extension.length),
    extension: extension,
    path: givenPath.slice(0, -pathName.length),
  };
};

/**
 *
 */
export const getAllItemsInDir = (directory: string = "./") =>
  fs.readdirSync(directory);

/**
 *
 * @param fileName
 */
export const getProjectThemeDirectory = (fileName: string) =>
  VS_CODE_CONTEXT.asAbsolutePath(Path.join("resources", "light", fileName));

/**
 *
 * @param filePath
 */
export const fileExists = (filePath: string = "") => fs.existsSync(filePath);

/**
 *
 * @param pathType
 */
export const getVscodeSettingPath = (pathType: string = null) => {
  let path: string = `${getVsCodeCurrentPath()}/.vscode/settings.json`;
  return {
    ...getPathInfoFromPath(path),
    full: path,
  };
};

/**
 *
 * @returns
 */
export const settingsFileExists = (): boolean =>
  fileExists(`${getVsCodeCurrentPath()}/.vscode/settings.json`);

/**
 * Create vc setting.json directory
 */
export const createPluginSettingsExist = (): void => {
  let noticeText: string = `Plugin MakeHidden requires a 'MakeHidden.json' file, would you like to create now?`;
  let grantedText: string = "One Time Create";

  vscode.window
    .showInformationMessage(noticeText, grantedText)
    .then((selection: string) => {
      if (selection === grantedText) {
        const path: string = getExtensionSettingPath();
        const info = getPathInfoFromPath(path);
        info["full"] = path;

        fs.mkdir(info["path"], (e) => {
          fs.writeFile(info["full"], `{}`, (err) => {
            if (err) {
              vscode.window.showInformationMessage(
                `Error creating settings.json in .vscode directory`
              );
              throw err;
            }
          });
        });
      }
    });
};

/**
 * Handel Process Errors
 * @param error
 * @param fallbackMsg
 */
export const handelError = (
  error: Error,
  fallback = "Sorry, Something went wrong"
) =>
  error.message === "silent" ? null : vscode.window.showErrorMessage(fallback);

/**
 * Helper function for VS Code quick message
 * @param error
 */
export const displayVsCodeMessage = (msg: string, bar = true) =>
  bar
    ? vscode.window.setStatusBarMessage(msg)
    : vscode.window.showInformationMessage(msg);

/**
 *
 * @param path
 * @returns
 */
export const buildPathObject = (chosenFilePath: string) => {
  const rootPath = getVsCodeCurrentPath();
  const relativePath = Path.relative(rootPath, chosenFilePath);
  const dirName = Path.dirname(chosenFilePath);
  const fileName = Path.basename(chosenFilePath);
  const extension = Path.extname(fileName);
  const name = Path.basename(fileName, extension);

  return {
    rootPath,
    chosenFilePath,
    relativePath,
    dirName,
    fileName,
    name,
    extension,
  };
};
