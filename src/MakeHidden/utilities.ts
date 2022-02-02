"use strict";
import * as vscode from "vscode";
import * as path from "path";
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

  projectFile = path.join(appData, channelPath, "User", PROJECTS_FILE);
  // in linux, it may not work with /var/local, then try to use /home/myuser/.config

  if (process.platform === "linux" && !fs.existsSync(projectFile)) {
    projectFile = path.join(
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
 *
 */
export const getVsCodeCurrentPath = () => {
  return vscode.workspace.rootPath;
};

/**
 *
 * @param givenPath
 */
export const getPathInfoFromPath = (givenPath: string = null) => {
  let extension: string = path.extname(givenPath);
  let pathName: string = path.basename(givenPath);
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
  VS_CODE_CONTEXT.asAbsolutePath(path.join("resources", "light", fileName));

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
  let pathInfo = getPathInfoFromPath(path);
  pathInfo["full"] = path;

  if (pathInfo.hasOwnProperty(pathType)) {
    return pathInfo[pathType];
  }

  return pathInfo;
};

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
