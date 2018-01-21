/* -- Third party import's -- */
import * as fs from 'fs';
import * as console from 'console';

/* -- Make hidden lib's -- */
import * as Util from '../utilities';

export interface WorkspaceLayout {
    id: string;
    name: string;
    path: string,
    excludedItems: any;
}

export default class WorkspaceManager { 

    workSpaceSettingPath : string = Util.getExtensionSettingPath();
    workspaces: WorkspaceLayout[] = [];
    projectRoot: string = '';

    /* --------------------
    */
    constructor(){
        this.load();
    }

    /* --------------------
    */
    private load(){
        let items: WorkspaceLayout[] = JSON.parse(fs.readFileSync( this.workSpaceSettingPath ).toString());
        this.workspaces = items;
    }

    /* --------------------
    */
    private save(){
        fs.writeFileSync( this.workSpaceSettingPath ,
            JSON.stringify( this.workspaces , null, "\t")
        );
    }

    /* --------------------
    */
    public create(
        name: string = 'makeHidden workspace',
        workspace: number = 0,
        excludedItems: any = {},
    ) {
        let workspaceChoices: any = {
            0 : 'global',
            1 : Util.getVsCodeCurrentPath(),
        };

        this.workspaces.push( this.buildObject( 
            name, workspaceChoices[ workspace ], 
            excludedItems 
        ) );

        this.save();
    }

    /* --------------------
    */
    public getAll( forProject: boolean = true ): WorkspaceLayout[] {
        return this.workspaces;
    }

    /* --------------------
    */
    public removeById( id: string = null ) {
        for ( let index in this.workspaces ) {
            let workspaces = this.workspaces[ index ];
            if ( workspaces.id === id ) {
                this.workspaces.splice(Number(index), 1);
                this.save();
            }
        }
    }

    /* --------------------
        private findByPath( path: string = 'all') {
            let foundWorkspace: any = [];
            for (let workspace of this.workspaces) { 
                if( path === 'all' ){
                    foundWorkspace.push( workspace );
                }
                else if ( workspace["path"] === path ) { 
                    foundWorkspace.push( workspace );
                }
            }
            return foundWorkspace;
        }
    */
    public fidById( id: string = null ) : WorkspaceLayout {
        let foundWorkspace: any = [];
        for (let workspace of this.workspaces ) { 
            if( workspace.id === id ){
                return workspace;
            }
        }
        return null;
    }

    /* --------------------
    */
    private buildObject(
        name: string = 'Make Hidden Workspace',
        path: string = 'global',
        items: any = {},
    ) : WorkspaceLayout {
        return {
            "id" : this.guidGenerator(),
            "name": name,
            "path": path,
            "excludedItems": items
        }
    }

    /* --------------------
    */
    private guidGenerator(): string {
        var S4 = function() {
           return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+"-"+S4());
    }
}
