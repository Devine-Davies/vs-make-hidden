import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from "os";

const HOME_DIR      = os.homedir();
const PROJECTS_FILE = "makeHidden.json";

/* --------------------
*/
export function getExtensionSettingPath(): string {
    let projectFile: string;
    const projectsLocation: string = vscode.workspace.getConfiguration("projectManager").get<string>("projectsLocation");
    if (projectsLocation !== "") {
        projectFile = path.join(projectsLocation, PROJECTS_FILE);
    } else {
        const appData = process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local");
        const channelPath: string = this.getChannelPath();
        projectFile = path.join(appData, channelPath, "User", PROJECTS_FILE);
        // in linux, it may not work with /var/local, then try to use /home/myuser/.config
        if ((process.platform === "linux") && (!fs.existsSync(projectFile))) {
            projectFile = path.join( HOME_DIR, ".config/", channelPath, "User", PROJECTS_FILE );
        }
    }
    return projectFile;
}

/* --------------------
*/
export function getChannelPath(): string {
    if (vscode.env.appName.indexOf("Insiders") > 0) {
        return "Code - Insiders";
    } else {
        return "Code";
    }
}

/* --------------------
*/
export function getVsCodeCurrentPath() {
    return vscode.workspace.rootPath;
}

export default class Utilities {

    pluginName: string = 'make-hidden';

    constructor( 
        public vsContext : vscode.ExtensionContext
    ){}

    /* --------------------
    */
    public getProjectThemeDirectory( fileName : string  ){
        return this.vsContext.asAbsolutePath( path.join(
            'resources', 'light', fileName
        ) );
    }

    /* --------------------
     * Get file folder info
     * dec: It will return the file extension if one has been found.
    */
    public getPathInfoFromPath( givenPath : string = null, ) : {  } {
        let extension: string = path.extname( givenPath );
        let pathName: string  = path.basename( givenPath );
        return {
            "basename"  : pathName,
            "filename"  : ( extension === '' )? pathName : pathName.slice(0, -extension.length ),
            "extension" : extension,
            "path"      : givenPath.replace( pathName , "" )
        }
    }

    /* --------------------
    */
    public getAllFilesDir( directory: string = './' ) {
        var files = fs.readdirSync( directory );
        return files;
    }

    /* --------------------
    */
    public getVscodeSettingPath( pathType: string = null ){
        let pathInfo: any = {
            'full'     : `${vscode.workspace.rootPath}/.vscode/settings.json`,
            'path'     : `${vscode.workspace.rootPath}/.vscode/`,
            'filename' : `settings.json`,
        };

        if( pathType != null ){
            if( pathInfo.hasOwnProperty( pathType ) ){
                return pathInfo[ pathType ];
            }
        }

        return pathInfo;
    }

    /* --------------------
    */
    public getItemFromJsonFile(
        fileFullPath: string = null,
        objectItem: string = null
    ){
        // var obj = require('file.json');
        // obj.newThing = 'thing!';
        if( fileFullPath && objectItem ){
            try  {
                let readFile = JSON.parse( fs.readFileSync( 
                    fileFullPath, { encoding: 'utf8' } 
                ) );
                if( readFile.hasOwnProperty( objectItem ) ) {
                    return JSON.parse( JSON.stringify( 
                        readFile[ objectItem ] 
                    ) );
                } 
                else {
                    return { "__error" : 'objectItem not found' };
                }
            } 
            catch (err)  {
                return { "__error" : 'File not found' };
            }
        }

        return { "__error" : `fileFullPath & objectItem not set` };
    }

    /* --------------------
    */
    public fileExists( filePath : string = '' ){
        return fs.existsSync( filePath );
    }

    /* --------------------
     * Create vc setting.json directory
    */
    public createVscodeSettingJson(
        request_users_permission : boolean = true
    ) : void  {
        let path : string = this.getVscodeSettingPath('path');
        let noticeText: string = `No 'vscode/settings.json' has been found, would you like to create now`;
        let grantedText: string = 'Yes, Create File';

        vscode.window.showInformationMessage( 
            noticeText, grantedText
        ).then( ( selection : string ) => {
            if( selection === grantedText ) {

                fs.mkdir( path , e =>  {
                    fs.writeFile( this.getVscodeSettingPath('full') , `{}`, ( err ) =>  {
                        if ( err ) {
                            vscode.window.showInformationMessage(`Error creating settings.json in .vscode directory`);
                            throw err
                        };
                    });
                } );

            }
        });
    }

    /* --------------------
    */
    public getVscodeCurrentDirPath() {
        return vscode.workspace.rootPath;
    }
}