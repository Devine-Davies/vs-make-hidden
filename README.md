# VS Code Make Hidden

## Features

* Make Hidden enhances the built-in functionality of "files.exclude" by proving an explorer view Pane interface for a quick overview of the hidden/exclude files/folders from the projects directory. 

* Context menus options are also added to perform multiply hidden/exclude options quickly and effortlessly.

## Using

#### Context menu items

Right-click on a file/folder and you will now have access to 3 new context menu items.

![Preview](resources/menus-explorer-context-menu.png)

`Make Hidden` will hide the current file/folder from the projects directory and add it into the "Hidden in directory" View Pane

`Make Hidden: All extensions from here` will detect the file extension of a selected file and hide all occurrences below that directory.

`Make Hidden: All extensions from root` will detect the file extension of a selected file and hide all occurrences from the root.

#### Hidden in directory

The "Hidden in directory" view pane will show all current occurrences of the items listed in the "files.exclude". 

> You can remove items in this list by selecting/click on the item you wish to remove.

![Preview](resources/views-explorer-makeHiddenViewPane.png)

## License

[MIT](LICENSE.md)