import * as Util from "../../utilities";
import {
  TreeDataProvider,
  EventEmitter,
  Event,
  TreeItem,
  TreeItemCollapsibleState,
  window,
} from "vscode";

interface CustomTreeItem {
  title: string;
  value: string;
}

export class ExcludeItemsViewPane implements TreeDataProvider<CustomTreeItem> {
  viewUpdatedEventEmitter: EventEmitter<CustomTreeItem>;
  onDidChangeTreeData: Event<any>;
  tree: CustomTreeItem[];

  /**
   *
   * @param name viewpane id
   */
  constructor(public name: string) {
    this.viewUpdatedEventEmitter = new EventEmitter();
    this.onDidChangeTreeData = this.viewUpdatedEventEmitter.event;
    window.registerTreeDataProvider(name, this);
  }

  /**
   * Updates the view pane item list
   * @param list
   */
  public update(list: string[]): void {
    this.tree = list.map((title) => ({ type: "string", title, value: title }));
    // @ts-ignore - Getting a type error. able to tree as arg when of type Node but panel stops responding
    this.viewUpdatedEventEmitter.fire();
  }

  /**
   * vscode function to render items to view
   */
  public getChildren(): any[] {
    return this.tree;
  }

  /**
   * vscode function, Pass our tree node item object to vs code§
   * @param node
   */
  public getTreeItem(node: CustomTreeItem): TreeItem {
    const { title, value } = node;
    const overrides = {
      iconPath: Util.getProjectThemeDirectory("put-back-icon.svg"),
      command: {
        command: "make-hidden.remove.item",
        title: title,
        arguments: [value],
      },
    };

    return {
      ...new TreeItem(title, TreeItemCollapsibleState.None),
      ...overrides,
    };
  }
}
