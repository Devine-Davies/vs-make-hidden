import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export default class Utilities {
    constructor( 
        public vsContext : vscode.ExtensionContext
     ){
        console.log( 'hrllo' );
    }

    /* --------------------
    */
    getProjectThemeDirectory( fileName : string  ){
        return this.vsContext.asAbsolutePath( path.join(
            'resources', 'light', fileName
        ) );
    }

    /* --------------------
     * Get file folder info
     * dec: It will return the file extension if one has been found.
    */
    getPathInfoFromPath( givenPath : string = null, ) : {  } {
        let extension: string = givenPath.slice( ( givenPath.lastIndexOf(".") - 1 >>> 0 ) + 2 );
        let pathName = path.basename( givenPath );

        return {
            "filename": pathName.slice(0, -( extension.length + 1 ) ),
            "extension": extension,
            "path": givenPath.replace( pathName , "")
        }
    }

    /* --------------------
    */
    getEnviourmentPath() {
        console.log( vscode.workspace.rootPath );
    }

}