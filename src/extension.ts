import * as vscode from 'vscode';
import * as fs from 'fs';

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
		provider.refresh();
	});

	dirWatcher.onDidDelete(() => {
		provider.refresh();
	});

	fileWatcher.onDidCreate(() => {
		provider.refresh();
	});

	fileWatcher.onDidDelete(() => {
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
		return this.getNotes();
	}

	getNotes = (): vscode.ProviderResult<vscode.TreeItem[]> => {
		let files : any[] = [];
		if (fs.existsSync(this.currentPath + "/.notes")) {
		files = fs.readdirSync(this.currentPath + "/.notes").filter(file => file.includes('.txt'));
		}

		const treeItems = [];
		for (const file of files) {
			const item = new vscode.TreeItem(file);
			item.command = {
				command: 'vscode.open',
				title: 'Open',
				arguments: [vscode.Uri.file(`${this.currentPath}/.notes/${item.label}`)]
			};
			treeItems.push(item);
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

	checkGitIgnoreFile = () => {
		if (!fs.existsSync(this.currentPath + "/.gitignore")) {
			fs.writeFileSync(this.currentPath + "/.gitignore", "");
		}
		const gitignorePath = this.currentPath + "/.gitignore";
		let gitignoreContent = '';
		if (fs.existsSync(gitignorePath)) {
			gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
		}
		if (!gitignoreContent.includes('.notes')) {
			gitignoreContent += '\n.notes';
			fs.writeFileSync(gitignorePath, gitignoreContent);
		}
	};

	addNote = async (): (Promise<void>) => {
		if (!fs.existsSync(this.currentPath + "/.notes")) {
			fs.mkdirSync(this.currentPath + "/.notes");
		}
		this.checkGitIgnoreFile();
		vscode.window.showInputBox({
		prompt: "Enter a name for the file:"
		}).then(fileName => {
			if (fileName) { fs.writeFileSync(this.currentPath + "/.notes/" + fileName + ".txt", ""); }
			else {vscode.window.showErrorMessage("Name not entered");};
		});		
	};
	
	refresh = (): void => {
		this._onDidChangeTreeData.fire(undefined);
		vscode.commands.executeCommand('setContext', 'notesView.notesLen', this.getNotesLen());
	};
}


const provider = new SideNotesProvider();

vscode.window.registerTreeDataProvider('notesView', provider);
