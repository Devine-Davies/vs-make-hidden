/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as ChildProcess from 'child_process';
import * as console from 'console';

/* -- Make hidden lib's -- */
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { connect } from 'tls';

export default class LayoutManagerController { 

    currentLayout: any = {};

    constructor(
        private mhUtilities: any = null,
        private layouts: any = {}
    ){}

    public getLayoutListForEnvironment( ){
        var globalList  = this.findByAccessLevel('global');
        var projectList = this.findByAccessLevel('projectDir');
        return projectList.concat( globalList );
    }

    save(layoutObject: any) {
    }

    getCurrentLayout() : any { 
        return this.currentLayout;
    }

    switch( layoutName: string ) {
        if ( this.update( layoutName ) ) {
            return this.getCurrentLayout();
        } else { 
            return null;
        }
    }

    update(layoutName: string) {
        let newLayout: any = this.find(layoutName);
        if ( newLayout != null ) {
            this.currentLayout = newLayout;
            return true;
        }

        return null;
    }

    remove(layoutName: string) {
        let index = 0;
        for ( let layout of this.layouts ) { 
            if (layout.name === layoutName) {
                this.layouts.splice(index, 1);
            }

            index++;
        }
    } 

    find(layoutName: string) {
        for (let layout of this.layouts) { 
            if ( layout['name'] === layoutName ) { 
                return layout;
            }
        }

        return null;
    }

    findByAccessLevel(accessLevel: string = null) {
        let foundLayouts: any = [];

        for (let layout of this.layouts) { 
            if ( layout["accessLevel"] === accessLevel ) { 
                foundLayouts.push( layout );
            }
        }

        return foundLayouts;
    }
}
