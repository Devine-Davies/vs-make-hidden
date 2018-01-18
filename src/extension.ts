'use strict';

/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as console from 'console';
import * as path from 'path';

/* -- Make hidden lib's -- */
import Utilities from './make-hidden/utilities';
import { connect } from 'net';
import ExcludeItemsController from './make-hidden/exclude-items/exclude-items.controller';
import WorkspaceManagerController from './make-hidden/workspace-manager/workspace-manager.controller';


var store = {
    workspaceManager: [ {
        "name": "Wordpress Main",
        "accessLevel": "global",
        "excludedItems": {
            "*.DS_Store": true,
            "*.DS_Store.*": true,
            "*.git": true,
            "*.git.*": true,
            "*.gitignore": true,
            "*.gitignore.*": true,
            "*.htaccess": true,
            "*.htaccess.*": true,
            "*.vscode.*": true,
            "*README": true,
            "*README.*": true,
            "*index": true,
            "*index.*": true,
            "*license": true,
            "*license.*": true,
            "*readme": true,
            "*readme.*": true,
            "*wp-activate": true,
            "*wp-activate.*": true,
            "*wp-admin": true,
            "*wp-admin.*": true,
            "*wp-blog-header": true,
            "*wp-blog-header.*": true,
            "*wp-comments-post": true,
            "*wp-comments-post.*": true,
            "*wp-config-sample": true,
            "*wp-config-sample.*": true,
            "*wp-config": true,
            "*wp-config.*": true,
            "*wp-cron": true,
            "*wp-cron.*": true,
            "*wp-includes": true,
            "*wp-includes.*": true,
            "*wp-links-opml": true,
            "*wp-links-opml.*": true,
            "*wp-load": true,
            "*wp-load.*": true,
            "*wp-login": true,
            "*wp-login.*": true,
            "*wp-mail": true,
            "*wp-mail.*": true,
            "*wp-settings": true,
            "*wp-settings.*": true,
            "*wp-signup": true,
            "*wp-signup.*": true,
            "*wp-snapshots": true,
            "*wp-snapshots.*": true,
            "*wp-trackback": true,
            "*wp-trackback.*": true,
            "*xmlrpc": true,
            "*xmlrpc.*": true,
            "wp-content/plugins/*.DS_Store": true,
            "wp-content/plugins/*.DS_Store.*": true,
            "wp-content/plugins/*advanced-custom-fields-pro": true,
            "wp-content/plugins/*advanced-custom-fields-pro.*": true,
            "wp-content/plugins/*akismet": true,
            "wp-content/plugins/*akismet.*": true,
            "wp-content/plugins/*contact-form-7": true,
            "wp-content/plugins/*contact-form-7.*": true,
            "wp-content/plugins/*duplicator": true,
            "wp-content/plugins/*duplicator.*": true,
            "wp-content/plugins/*hello": true,
            "wp-content/plugins/*hello.*": true,
            "wp-content/plugins/*index": true,
            "wp-content/plugins/*index.*": true,
            "wp-content/plugins/*insert-pages": true,
            "wp-content/plugins/*insert-pages.*": true,
            "wp-content/plugins/*multisite-language-switcher": true,
            "wp-content/plugins/*multisite-language-switcher.*": true,
            "wp-content/plugins/*polylang": true,
            "wp-content/plugins/*polylang.*": true,
            "wp-content/plugins/*svg-support": true,
            "wp-content/plugins/*svg-support.*": true,
            "wp-content/plugins/*tinymce-advanced": true,
            "wp-content/plugins/*tinymce-advanced.*": true,
            "wp-content/themes/*.DS_Store": true,
            "wp-content/themes/*.DS_Store.*": true,
            "wp-content/themes/*index": true,
            "wp-content/themes/*index.*": true,
            "wp-content/themes/*twentyfifteen": true,
            "wp-content/themes/*twentyfifteen.*": true,
            "wp-content/themes/*twentyseventeen": true,
            "wp-content/themes/*twentyseventeen.*": true,
            "wp-content/themes/*twentysixteen": true,
            "wp-content/themes/*twentysixteen.*": true
        }
    }, {
        "name": "Workspace Two",
        "accessLevel": "project",
        "excludedItems": {
            "index.php" : true
        }
    }],
};

const rootPath = vscode.workspace.rootPath;

/* --------------------
 * Extension activation
 * Vscode Func: command is executed and extension is activated the very first time the 
*/
export function activate( context : vscode.ExtensionContext ) {

    /* -- Make Hidden Classes -- */
    const utilities = new Utilities( context );
    const excludeItemsController = new ExcludeItemsController( 
        utilities
    );
    const workspaceManager = new WorkspaceManagerController( utilities, store.workspaceManager );

    /* --------------------
     * Called on 
    */
    let hideItem = vscode.commands.registerCommand('make-hidden.hideItem', ( e : any ) =>  {
        if( isVscodeFileObject( e ) ) {
            let file_name : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            excludeItemsController.hideItem( file_name );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Hide Item in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let superHide = vscode.commands.registerCommand('make-hidden.superHide', ( e : any ) =>   {
        if( isVscodeFileObject( e ) ) {
            excludeItemsController.superHide( e, rootPath );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Super Hide in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let showOnly = vscode.commands.registerCommand('make-hidden.showOnly', ( e : any ) =>  {
        if( isVscodeFileObject( e ) ) {
            let fileName : string = e.fsPath.replace( rootPath , '' ).slice( 1 );
            excludeItemsController.showOnly( fileName );
        }
        else if( e == undefined ) {
            let msg: string = `MH: Select Hide Item in the context menu on a directory item`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let removeItem = vscode.commands.registerCommand('make-hidden.removeItem', ( excludeString : string ) =>  {
        if( typeof excludeString == 'string' ) {
            if( excludeString.length > 0 ){
                excludeItemsController.removeItem( excludeString );
            }
        }
        else {
            let msg: string = `MH: Please select an item from the view pane 'Hidden in Directory'`;
            vscode.window.showInformationMessage( msg )
        }
    });

    /* --------------------
     * Called on 
    */
    let emptyConfig = vscode.commands.registerCommand('make-hidden.removeAllItems', () => {
        excludeItemsController.removeAllItems();
    });

    /* -- Subscribe commands -- */
    // -- Hide
    context.subscriptions.push( hideItem );
    context.subscriptions.push( superHide );
    context.subscriptions.push( showOnly );
    // -- Show
    context.subscriptions.push( removeItem );
    context.subscriptions.push( emptyConfig );

    /* --------------------
     * Called on 
    */
    var workspaceCmdList = ['workspaceSave', 'workspaceLoad', 'workspaceDelete'];
    workspaceCmdList.forEach( ( workspaceCmd ) => {
        let registerCommand = vscode.commands.registerCommand(`make-hidden.${workspaceCmd}`, () => {

            let workspaceList = workspaceManager.getWorkspaceForProject( );
            let workspaceNameList: string[] = [];

            workspaceList.forEach( ( workspaceObject: any = {} ) => {
                let label: string =  ( ( workspaceObject.accessLevel === 'global' )? 'Global: ' : '' ) + workspaceObject.name;
                workspaceNameList.push( label );
            } );
            workspaceNameList.push( 'Close' );

            switch( workspaceCmd ){
                case 'workspaceSave' : 
                    let accessLevelOptions: string[] = ['Save globally', 'Save for current project', 'Close'];
                    vscode.window.showQuickPick( accessLevelOptions )
                    .then( ( accessLevel ) => {
                        if( accessLevel === 'Close' ) return;
                        vscode.window.showInputBox({prompt: 'Name workspace'})
                        .then( ( workspaceName ) => {
                            workspaceManager.saveNew(
                                workspaceName, accessLevelOptions.indexOf( accessLevel ), 
                                excludeItemsController.getFilesExcludeObject()
                            );
                        });
                    });
                break;

                case 'workspaceLoad' :
                    vscode.window.showQuickPick( workspaceNameList )
                    .then( ( val ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceIndex = workspaceNameList.indexOf( val );
                        let chosenWorkspace = workspaceList[ chosenWorkspaceIndex ];
                        excludeItemsController.loadList( chosenWorkspace['excludedItems'] )
                    });
                break;

                case 'workspaceDelete' :
                    vscode.window.showQuickPick( workspaceNameList )
                    .then( ( val ) => {
                        if( val === 'Close' ) return;
                        let chosenWorkspaceIndex = workspaceNameList.indexOf( val );
                        let chosenWorkspace = workspaceList[ chosenWorkspaceIndex ];
                        workspaceManager.remove( chosenWorkspace );
                    });
                break;
            }
        });

        context.subscriptions.push( registerCommand );
    })
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function isVscodeFileObject( obj : any = null ) : boolean {
    if( typeof obj == 'object' ) {
        for ( let prop in obj )  {
            if( prop == 'fsPath') {
                return true;
            }
        }
    }

    return false;
}