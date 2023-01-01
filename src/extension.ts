import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.executeCommand('setContext', 'notesView.notesLen', provider.getNotesLen());

	context.subscriptions.push(
		vscode.commands.registerCommand('notesView.addNote', async () => {
			vscode.window.showInformationMessage('Hello World!'+ provider.getNotesLen());
			await provider.addNote();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('notesView.refresh', async () => {
			vscode.window.showInformationMessage('Refresh '+ provider.getNotesLen());
			provider.refresh();
		})
	);

	const [dirWatch, fileWatch] = watcherOnNotesFolder(provider);
	
	context.subscriptions.push(dirWatch);
	context.subscriptions.push(fileWatch);

}

const watcherOnNotesFolder = (provider: SideNotesProvider) => {
	const currentPath = vscode.workspace.rootPath;

	const dirWatcher = vscode.workspace.createFileSystemWatcher(currentPath + "/.notes");
	const fileWatcher = vscode.workspace.createFileSystemWatcher(currentPath + "/.notes/*");

	dirWatcher.onDidCreate(() => {
		console.log('dir watcher create');
		provider.refresh();
	});

	dirWatcher.onDidDelete(() => {
		console.log('dir watcher delete');
		provider.refresh();
	});

	fileWatcher.onDidCreate(() => {
		console.log('file watcher create');
		provider.refresh();
	});

	fileWatcher.onDidDelete(() => {
		console.log('file watcher delete');
		provider.refresh();
	});

	return [dirWatcher, fileWatcher];
};

class SideNotesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

	private currentPath = vscode.workspace.rootPath;
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor() { 
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
		console.log('in get children');
		return this.getNotes();
	}

	getNotes = (): vscode.ProviderResult<vscode.TreeItem[]> => {
		let files : any[] = [];
		if (fs.existsSync(this.currentPath + "/.notes")) {
		files = fs.readdirSync(this.currentPath + "/.notes");
		}

		let numFiles = files.length;

		const treeItems = [];
		for (const file of files) {
			treeItems.push(new vscode.TreeItem(file));
		}
		return treeItems;
	};

	getNotesLen = () : number => {
		if (fs.existsSync(this.currentPath + "/.notes")) {
			const files = fs.readdirSync(this.currentPath + "/.notes");
			const numFiles = files.length || 0;
			return numFiles;
		} else {
			return 0;
		}
	};

	addNote = async (): (Promise<void>) => {
		if (!fs.existsSync(this.currentPath + "/.notes")) {
			fs.mkdirSync(this.currentPath + "/.notes");
		}
		
		vscode.window.showInputBox({
		prompt: "Enter a name for the file:"
		}).then(fileName => {
			fs.writeFileSync(this.currentPath + "/.notes/" + fileName + ".txt", "");
		});		
	};
	
	refresh = (): void => {
		console.log('in refresh');
		this._onDidChangeTreeData.fire(undefined);
		vscode.commands.executeCommand('setContext', 'notesView.notesLen', this.getNotesLen());
	};
}


vscode.window.onDidChangeActiveTextEditor((editor) => {
	console.log('Active text editor changed', editor);
	provider.refresh();
});
console.log();
const provider = new SideNotesProvider();
vscode.window.registerTreeDataProvider('notesView', provider);

// vscode.window.onDidChangeWindowState((view: vscode.WindowState) => {
// 	// Check if active view is the "notesView" view
// 	console.log(view);
// 	// if (view && view.name === 'notesView') {
// 	// // Call function
// 	// provider.refresh();
// 	// }
// 	});

// vscode.window.onDidChangeActiveTextEditor(() => {
// 	// Get current active editor
// 	const editor = vscode.window.activeTextEditor;
	
// 	// Check if active editor is the "notesView" view
// 	if (editor && editor.viewColumn && editor.viewColumn.name === 'notesView') {
// 		// Set up tree item click event listener
// 		vscode.window.registerTreeViewEventHandler('notesView', {
// 			onDidClick: (event: vscode.TreeViewItemClickEvent<vscode.TreeItem>) => {
// 				// Get file path from tree item
// 				const filePath = event.item.label;
// 				// Create file URI
// 				const fileUri = vscode.Uri.file(filePath);

// 				// Open file
// 				vscode.window.showTextDocument(fileUri);
// 			}
// 		});
// 	}
// });


vscode.window.onDidChangeTextEditorViewColumn(() => {
	console.log('Active view changed:');
	});