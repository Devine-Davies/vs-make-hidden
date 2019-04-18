// //
// // Note: This example test is leveraging the Mocha test framework.
// // Please refer to their documentation on https://mochajs.org/ for help.
// //

// // The module 'assert' provides assertion methods from node
// // var beforeEach = require('mocha').beforeEach;
// import * as mocha from 'mocha';
// import * as assert from 'assert';

// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../src/extension';

// import * as Util from '../src/make-hidden/utilities';
// import { WorkspaceManager} from '../src/make-hidden/ExcludeItems/ExcludeItems.workspaces';
// let workspaceManager = new WorkspaceManager();

// suite("utilities Tests", () => {
//     test("!!! Expect getVsCodeCurrentPath to return vs current working path", function () {
//         assert.equal( Util.getVsCodeCurrentPath(), vscode.workspace.rootPath );
//     });

//     suite("getPathInfoFromPath()", () => {
//         test("01. Expect basename, filename, extension, path to be correct.", function () {
//             let data = Util.getPathInfoFromPath( '../src/make-hidden/workspace-manager/workspace-manager' );
//             assert.equal( data['basename'], "workspace-manager" );
//             assert.equal( data['filename'], "workspace-manager" );
//             assert.equal( data['extension'], "" );
//             assert.equal( data['path'], "../src/make-hidden/workspace-manager/" );
//         });

//         test("02. Expect basename, filename, extension, path to be correct.", function () {
//             let data = Util.getPathInfoFromPath( '../src/make-hidden/workspace-manager/workspace-manager.controller' );
//             assert.equal( data['basename'], "workspace-manager.controller" );
//             assert.equal( data['filename'], "workspace-manager" );
//             assert.equal( data['extension'], ".controller" );
//             assert.equal( data['path'], "../src/make-hidden/workspace-manager/" );
//         });

//         test("03. Expect basename, filename, extension, path to be correct.", function () {
//             let data = Util.getPathInfoFromPath( 'src/workspace-manager.controller.js' );
//             assert.equal( data['basename'], "workspace-manager.controller.js" );
//             assert.equal( data['filename'], "workspace-manager.controller" );
//             assert.equal( data['extension'], ".js" );
//             assert.equal( data['path'], "src/" );
//         });
//     });

//     test("Expect setting path to be applied to basename, filename, extension & path", function () {
//         let data = Util.getVscodeSettingPath();
//         assert.equal( data['basename'], "settings.json" );
//         assert.equal( data['filename'], "settings" );
//         assert.equal( data['extension'], ".json" );
//         assert.equal( data['path'], "undefined/.vscode/" );
//     });
// });

// // Defines a Mocha test suite to group tests of similar kind together

// suite("WorkspaceManager", () => {

//     suite("Create Workspace", () => {
//         workspaceManager.removeAll();

//         let mocData : any = {
//             'name' : 'Test Subject',
//             'ei'   : { 'test item' : true }
//         }

//         test("Expect no workspaces to be present", function () {
//             workspaceManager.removeAll();
//             let all = workspaceManager.getAll();
//             assert.equal( all.length, 0 );
//         });

//         test("Expect create to fail as no name given", function () {
//             workspaceManager.create( );
//             let all = workspaceManager.getAll();
//             assert.equal( all.length, 0 );
//         });

//         test("Expect create to fail as no excludedItems given", function () {
//             workspaceManager.create( mocData['name'] );
//             let all = workspaceManager.getAll();
//             assert.equal( all.length, 0 );
//         });

//         test("Expect global workspace to be created", function () {
//             workspaceManager.create( mocData['name'], mocData['ei'] );
//             let allWs = workspaceManager.getAll();

//             let globalWs = allWs[0];
//             assert.equal( globalWs['name'], mocData['name'] );
//             assert.equal( globalWs['path'], 'global' );
//             assert.equal( globalWs['excludedItems'], mocData['ei'] );
//         });

//         test("Expect local workspace to be created", function () {
//             // Util.getVsCodeCurrentPath()
//             // vscode.workspace.rootPath
//             workspaceManager.create( mocData['name'] + ' local', mocData['ei'], 'current/working/dir' );
//             let allWs = workspaceManager.getAll();
//             let localWs = allWs[1];
//             assert.equal( localWs['name'], mocData['name'] + ' local' );
//             assert.equal( localWs['excludedItems'], mocData['ei'] );
//             assert.equal( localWs['path'], 'current/working/dir' );
//         });
//     });

//     suite("Expect remove all to clear all workspace", () => {
//         workspaceManager.removeAll();
//         assert.equal( workspaceManager.getAll(), 0 );
//     });

//     test("Expect delete to remove workspace", () => {
//         workspaceManager.removeAll();
//         workspaceManager.create( 'test remove', {}, 'current/working/dir' );
//         let allWs = workspaceManager.getAll();
//         workspaceManager.removeById( allWs[0]['id'] );
//         assert.equal( workspaceManager.getAll(), 0 );
//     });

// });