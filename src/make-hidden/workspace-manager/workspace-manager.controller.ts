/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as ChildProcess from 'child_process';
import * as console from 'console';

/* -- Make hidden lib's -- */
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { connect } from 'tls';

export default class WorkspaceManagerController { 

    accessLevels = {
        0 : 'global',
        1 : 'project',
    }

    constructor(
        private mhUtilities: any = null,
        private allWorkspaces: any = {}
    ){}

    /* --------------------
    */
    public getWorkspaceForProject( ){
        var globalList  = this.findByAccessLevel('global');
        var projectList = this.findByAccessLevel('project');
        return projectList.concat( globalList );
    }

    /* --------------------
    */
    public saveNew(
        name: string = 'makeHidden workspace',
        accessLevelIndex: number = 0,
        excludedItems: any = {},
    ) {
        this.allWorkspaces.push( this.buildWorkspaceObject( 
            name, this.accessLevels[ accessLevelIndex ], excludedItems 
        ) );
    }

    /* --------------------
    */
    public remove( workspaceObj : any = this.buildWorkspaceObject() ) {
        let index = 0;
        for ( let wso of this.allWorkspaces ) {
            let check = {
                "name" : wso["name"] === workspaceObj["name"],
                "accessLevel" : wso["accessLevel"] === workspaceObj["accessLevel"]
            }
            
            if ( check["name"] && check["accessLevel"] ) {
                this.allWorkspaces.splice(index, 1);
            }
            
            index++;
        }
    }

    /* --------------------
    */
    private buildWorkspaceObject(
        name: string = 'makeHidden workspace',
        accessLevel: string = 'global',
        excludedItems: any = {},
    ){
        return {
            "name": name,
            "accessLevel": accessLevel,
            "excludedItems": excludedItems
        }
    }

    /* --------------------
    */
    private findByAccessLevel(accessLevel: string = null) {
        let foundWorkspace: any = [];
        for (let workspace of this.allWorkspaces) { 
            if ( workspace["accessLevel"] === accessLevel ) { 
                foundWorkspace.push( workspace );
            }
        }

        return foundWorkspace;
    }
}
