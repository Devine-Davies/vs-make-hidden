/* -- Make hidden lib's -- */
import * as Util from '../../utilities';
import { Node, parseTree } from 'jsonc-parser';
import { TreeDataProvider, EventEmitter, Event, TreeItem, TreeItemCollapsibleState, window } from 'vscode';

export default class ExcludeItemsViewPane implements TreeDataProvider<Node>  {
  private viewUpdatedEventEmitter: EventEmitter<Node | null> = new EventEmitter<Node | null>();
  readonly onDidChangeTreeData: Event<Node | null> = this.viewUpdatedEventEmitter.event;
  public tree: Node = {
      type: 'object',
      offset: 0,
      length: 0,
      children: []
  };

  constructor(viewPaneName: string) {
      this.register(viewPaneName);
      this.registerEvents();
  }

  /* --------------------
  * Register a view pane with vs code view: showing the excluded items
  */
  private register(name: string = '') {
      window.registerTreeDataProvider(name, this);
  }

  /* --------------------
  * When a redrawn has occurred on the register view pane
  */
  private registerEvents() {
      this.onDidChangeTreeData(() => {
          // console.log('Updating...');
      });
  }

  /* --------------------
   * Updates the view pane item list
  */
  public update(list: string[]): void {
      let treeString: string = JSON.stringify(list)
      this.tree = parseTree(treeString);
      this.viewUpdatedEventEmitter.fire();
  }

  /* --------------------
   * vscode function to render items to view
  */
  public getChildren(): Thenable<Node[]> {
      return Promise.resolve(this.tree.children);
  }

  /* --------------------
   * vscode function, Pass our tree node item object to vs code
  */
  public getTreeItem(node: Node): TreeItem {
      let itemTitle: string = node.value;

      let treeItem: TreeItem = new TreeItem(
          itemTitle,
          TreeItemCollapsibleState.None
      );

      treeItem.iconPath = Util.getProjectThemeDirectory('put-back-icon.svg');
      treeItem.command = {
          command: 'make-hidden.removeItem',
          title: itemTitle,
          tooltip: itemTitle,
          arguments: [itemTitle]
      };

      return treeItem;
  }
}