// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('arbtools.sortArbFile', sortArb);

	context.subscriptions.push(disposable);
}


type ArbObject = {
	[key: string]: string | ArbObject;
}

function sortArb() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}

	const document = editor.document;
	const extension = path.extname(document.fileName);

	if (extension !== '.arb') {
		vscode.window.showErrorMessage('Current file is not an ARB file.');
		return;
	}

	const text = document.getText();
	// Your formatting logic here

	sortArbFile(text);

}

function sortArbFile(text: string) {
	let arbJson;
	try {
		arbJson = JSON.parse(text);
	} catch (e) {
		vscode.window.showErrorMessage('Failed to parse ARB file.');
		return;
	}

	const sortedArbJson = sortArbJson(arbJson);
	if (!sortedArbJson) {
		return;
	}
	writeArbFile(sortedArbJson);
}

function sortArbJson(arbJson: ArbObject): ArbObject | undefined {
	// Step 1: Find the key for locale. That should be put as the first key.
	const sortedArbJson: ArbObject = {};
	const errors: Array<string> = [];
	if (!arbJson['@@locale']) {
		errors.push('@@locale key not found.');
	} else {
		sortedArbJson['@@locale'] = arbJson['@@locale'];
	}

	// Step 2: Sort the rest of the keys. 
	// If the key start with `@`, then it should be put to the key with the 
	// same value after `@`.
	const keys = Object.keys(arbJson).filter(key => !key.startsWith('@')).sort();
	const metadataKeys = Object.keys(arbJson).filter(key => key.startsWith('@') && key !== '@@locale');
	for (const key of metadataKeys) {
		const valueKey = key.substring(1);
		if (!arbJson[valueKey]) {
			errors.push(`key ${valueKey} not found but it has a metadata for it.`);
		}
	}

	if (errors.length > 0) {
		vscode.window.showErrorMessage(errors.join('\n'));
		return;
	}

	for (const key of keys) {
		sortedArbJson[key] = arbJson[key];
		if (arbJson[`@${key}`]) {
			sortedArbJson[`@${key}`] = arbJson[`@${key}`];
		}
	}

	return sortedArbJson;
}

function writeArbFile(arbJson: ArbObject) {
	const formattedText = JSON.stringify(arbJson, null, 2);
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const document = editor.document;
	const edit = new vscode.TextEdit(new vscode.Range(0, 0, document.lineCount, document.lineAt(document.lineCount - 1).text.length), formattedText);
	const workspaceEdit = new vscode.WorkspaceEdit();
	workspaceEdit.set(document.uri, [edit]);
	vscode.workspace.applyEdit(workspaceEdit);
}

// This method is called when your extension is deactivated
export function deactivate() { }
