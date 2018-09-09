/* -- Third party import's -- */
import * as vscode from 'vscode';
import * as ChildProcess from 'child_process';
import * as console from 'console';

/* -- Make hidden lib's -- */
import * as Util from '../utilities';
import ExcludeItemsProvider from './exclude-items.provider';

export default class ExcludeItemsController extends ExcludeItemsProvider {

    private hideLevels : string[ ] = [
        "root", "current", "current&below", "below"
    ];

    private hideLevelsObject : any = {
        "root"          : { regexCode : '**/', incPath : false },
        "current"       : { regexCode : '*',   incPath : true  },
        "current&below" : { regexCode : '**/', incPath : true  },
        "below"         : { regexCode : '*/',  incPath : true  },
    };

    constructor() {
        super( );

        /* -- Assign our MH to VS window tree provider  --*/
        vscode.window.registerTreeDataProvider('makeHiddenViewPane', this);
        this.onDidChangeTreeData( ( e ) => { } )
    }

    /* --------------------
    */
    public getList(): any {
        return this.excludeList;
    }

    /* --------------------
     * Remove all regex item's from config list
     * dec: removes all items in get_workspace_configuration(files.exclude)
    */
    public loadList( fileExcludedObject: any = {} ) : void {
        this.saveFilesExcludeObject( fileExcludedObject );
    }

    /* --------------------
    */
    public showOnly( itemPath : string = null ){
        if ( itemPath ) {
            this.showOnlyFilterer( itemPath, true, false, 1 );
        }
    }

    /* --------------------
    */
    private showOnlyFilterer(
        itemPath : string = null,
        matchByName : boolean = true,
        matchByExtension: boolean = true,
        hideLevel : number = 0
    ) {
        if ( itemPath ) {
            let targetFilePathProps: any = Util.getPathInfoFromPath( itemPath );
            let workspacePath : any = Util.getVsCodeCurrentPath();;

            var targetFile = `${ targetFilePathProps['basename'] }`;
            let filesExcludeObject: any = this.getFilesExcludeObject();
            let allItemInPath : string[] = Util.getAllItemsInDir(
                `${ workspacePath }/${ targetFilePathProps['path'] }`
            );

            for( var fileName of allItemInPath ){
                if( fileName != targetFile ){
                    let filePath = `${targetFilePathProps['path']}${fileName}`;

                    let thisFileNamePathProps: any = Util.getPathInfoFromPath(filePath);

                    let excludeSnippets: any = this.buildExcludeRegex(
                        filePath, hideLevel
                    );

                    let checks = {
                       'byName'      : ( matchByName ),
                       'byExtension' : ( matchByExtension && thisFileNamePathProps['extension'] !== "" ),

                       // Hide with opposite Names & Extension
                       'isDifferentNames'     : ( targetFilePathProps['filename']  != thisFileNamePathProps['filename'] ),
                       'isDifferentExtension' : ( targetFilePathProps['extension'] != thisFileNamePathProps['extension'] ),
                    }

                    if( checks['byName'] ){
                        if( checks['isDifferentNames'] ){
                            filesExcludeObject[ excludeSnippets['byName'] ] = true;
                            filesExcludeObject[ excludeSnippets['byNameWithExtension'] ] = true;
                        }
                    }

                    if( checks['byExtension'] ){
                        if( checks['isDifferentNames'] && checks['isDifferentExtension'] ){
                            filesExcludeObject[ excludeSnippets['allExtension'] ] = true;
                        }
                    }
                }
            }

            /* -- Save the new work space -- */
            this.saveFilesExcludeObject( filesExcludeObject );
        }
    }



    /* --------------------
     * Hide item
     * dec: Appends the dir/file name into vs code user settings file.excludes
    */
    public hideItem( itemPath : string = null ) : void {
        if ( itemPath ) {
            let filesExcludeObject: any = this.getFilesExcludeObject();
            filesExcludeObject[ itemPath ] = true;
            this.saveFilesExcludeObject( filesExcludeObject );
        }
    }

    /* --------------------
     * Hide item
     * dec: Appends the dir/file name into vs code user settings file.excludes
    */
    public superHide( e, rootPath ) {
        let hideByOptions: string[] = [
            `Hide against matching name's`,
            `Hide against matching extension's`,
            // By Name & Extension
        ];

        let hideLevelOptions: string[] = [
            `Root directory`,
            `Current directory`,
            `Current & Child directories`,
            `Child directories only`
        ];

        vscode.window.showQuickPick( hideByOptions ).then( ( hideBySelection : string ) => {
            let hideByType: boolean = ( hideByOptions.indexOf( hideBySelection ) > 0 )? true : false;

            vscode.window.showQuickPick( hideLevelOptions ).then( ( val : string ) => {
                let itemPath: string =  e.fsPath.replace( rootPath , '' ).slice( 1 );
                let hideLevel: number = hideLevelOptions.indexOf( val );
                this.hideItems( itemPath, hideByType, hideLevel );
            } );
        } );
    }

    /* --------------------
     * Hide item
     * itemPath : string = null,
     * includeItemExtension: boolean = false,
     * hideLevelIndex : number = 0,
    */
    public hideItems(
        itemPath : string = null,
        includeItemExtension: boolean = false,
        hideLevelIndex : number = 0,
    ) {
        let filesExcludeObject : any = this.getFilesExcludeObject();
        let hideLevelObject    : any = this.getHideLevelByIndex(hideLevelIndex);
        let itemPathProps      : any = Util.getPathInfoFromPath(itemPath);
        let excludeSnippets    : any = this.buildExcludeRegex(itemPath, hideLevelIndex);

        // By Name
        if( ! includeItemExtension ){
            filesExcludeObject[ excludeSnippets['byName'] ] = true;
            filesExcludeObject[ excludeSnippets['byNameWithExtension'] ] = true;
        }

        // By Extension
        if( includeItemExtension && itemPathProps['extension'] !== '.' ){
            filesExcludeObject[ excludeSnippets['allExtension'] ] = true;
        }

        /* -- Save the new work space -- */
        this.saveFilesExcludeObject( filesExcludeObject );

        /* -- Run a count on all effected files -- */
        // this.countAllAffectedFiles( excludeSnippet );
    }

    /* --------------------
    */
    private buildExcludeRegex( itemPath : string = null, hideLevelIndex : number = 0 ) : any {
        let hideLevelObject : any = this.getHideLevelByIndex(hideLevelIndex);
        let itemPathProps   : any = Util.getPathInfoFromPath(itemPath);
        let excludeSnippet  : string = `${ hideLevelObject.regexCode }`;

        // Check to see if to add item path
        if( hideLevelObject.incPath ){
            excludeSnippet = `${ itemPathProps['path'] }` + excludeSnippet;
        }

        return {
            'self'                : `${itemPath}`,
            'byName'              : `${excludeSnippet}${itemPathProps['filename']}`,
            'byNameWithExtension' : `${excludeSnippet}${itemPathProps['filename']}.*`,
            'allExtension'        : `${excludeSnippet}*${itemPathProps['extension']}`,
        }
    }

    /* --------------------
    */
    private getHideLevelByIndex( hide_level_index : number = 0 ) {
        let hide_level : string = this.hideLevels[ hide_level_index ];
        let hide_level_object : any = this.hideLevelsObject[ hide_level ];
        return hide_level_object;
    }

    /* --------------------
     * Remove regex from config list : Remove item
     * dec: Removes an item from the config list
    */
    public removeItem( item_key : string = null ) : void {
        if( item_key ) {
            let filesExcludeObject: any = this.getFilesExcludeObject();
            delete filesExcludeObject[ item_key ];
            this.saveFilesExcludeObject( filesExcludeObject )
        }
    }

    /* --------------------
     * Remove all regex item's from config list
     * dec: removes all items in get_workspace_configuration(files.exclude)
    */
    public removeAllItems() : void {
        this.saveFilesExcludeObject( {} );
    }

    /* --------------------
     * Effected files counter
     * dec: info windows displays a count of all affected files
    */
    private countAllAffectedFiles( exclude_snippet : string = null ) {
        let os_type : string = process.platform;
        let all_os_types : string[]     = ['darwin', 'freebsd', 'linux', 'sunos', 'win32'];
        let allowed_os_types : string[] = ['darwin', 'linux'];

        if( allowed_os_types.indexOf( os_type ) > -1 ) {
            ChildProcess.exec(`cd ${vscode.workspace.rootPath} && find ${exclude_snippet}  -type f | wc -l`, (error, stdout, stderr) => {

                if (error) {
                    console.error(`exec error: ${error}`); return;
                }

                vscode.window.showInformationMessage(`Affected files: ${stdout}`);
            });
        }
    }
}