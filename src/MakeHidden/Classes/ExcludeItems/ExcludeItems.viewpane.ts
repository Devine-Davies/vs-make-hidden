import * as Util from "../../utilities";
import { Node, parseTree } from "jsonc-parser";
import {
  TreeDataProvider,
  EventEmitter,
  Event,
  TreeItem,
  TreeItemCollapsibleState,
  window,
} from "vscode";

export class ExcludeItemsViewPane implements TreeDataProvider<Node> {
  private viewUpdatedEventEmitter: EventEmitter<Node> = new EventEmitter<Node>();
  readonly onDidChangeTreeData: Event<any> = this.viewUpdatedEventEmitter.event;

  private tree: Node = {
    type: "object",
    offset: 0,
    length: 0,
    children: [],
  };

  /**
   *
   * @param name viewpane id
   */
  constructor(name: string, onTreeUpdate = () => {}) {
    this.register(name);
    // this.viewUpdatedEventEmitter.event(onTreeUpdate);
  }

  /**
   * Register a view pane with vs code view: showing the excluded items
   * @param name
   */
  private register(name: string = "") {
    window.registerTreeDataProvider(name, this);
  }

  /**
   * When a redrawn has occurred on the register view pane
   */
  //   private registerEvents() {
  //     this.viewUpdatedEventEmitter.event(() => {
  //         console.log('Updating...');
  //     });
  //   }

  /**
   * Updates the view pane item list
   * @param list
   */
  public update(list: string[]): void {
    this.tree = parseTree(JSON.stringify(list));
    this.viewUpdatedEventEmitter.fire();
  }

  /**
   * vscode function to render items to view
   */
  public getChildren(): Thenable<Node[]> {
    return Promise.resolve(this.tree.children);
  }

  /**
   * vscode function, Pass our tree node item object to vs code§
   * @param node
   */
  public getTreeItem(node: Node): TreeItem {
    let itemTitle: string = node.value;

    let treeItem: TreeItem = new TreeItem(
      itemTitle,
      TreeItemCollapsibleState.None
    );

    treeItem.iconPath = Util.getProjectThemeDirectory("put-back-icon.svg");
    treeItem.command = {
      command: "make-hidden.removeItem",
      title: itemTitle,
      tooltip: itemTitle,
      arguments: [itemTitle],
    };

    return treeItem;
  }
}
