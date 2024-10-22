import * as assert from 'assert';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { activate, getDocPath, getDocUri, doc } from './helper';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	var tempFilePath: string;
	var errorMessage = '';
	setup(async () => {
		errorMessage = '';
		vscode.window.showErrorMessage = (message: string) => {
			errorMessage = message;
			return Promise.resolve();
		};
	});

	suite('With correct arb extension', () => {
		setup(async () => {
			// Create a temporary file path within the workspace
			const tempFileName = 'temp_' + Date.now() + '.arb';
			tempFilePath = getDocPath(tempFileName);
			const ext = vscode.extensions.getExtension('owl-studio.arbtools')!;
			await ext.activate();
		});

		teardown(async () => {
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFilePath));
		});

		test('should sort the arb file when the format of the arb file is correct', async () => {
			// Arrange
			const sourceFileUri = getDocUri('input_correct.arb.txt');
			// Write content to the temporary file
			await vscode.workspace.fs.writeFile(vscode.Uri.file(tempFilePath), await vscode.workspace.fs.readFile(sourceFileUri));

			await vscode.workspace.openTextDocument(tempFilePath).then(async doc => {
				await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('arbtools.sortArbFile');
			});

			// Assert
			const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(tempFilePath));
			const expectedContent = await vscode.workspace.fs.readFile(getDocUri('output_correct.arb.txt'));
			assert.equal(fileContent.toString(), expectedContent.toString());
		});


		test('should show error message when the arb file has a matadata with unmapped key', async () => {
			// Arrange
			const sourceFileUri = getDocUri('input_incorrect_metadata_without_label.arb.txt');
			// Write content to the temporary file
			await vscode.workspace.fs.writeFile(vscode.Uri.file(tempFilePath), await vscode.workspace.fs.readFile(sourceFileUri));

			await vscode.workspace.openTextDocument(tempFilePath).then(async doc => {
				await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('arbtools.sortArbFile');
			});

			// Assert
			assert.equal(errorMessage, 'key a not found but it has a metadata for it.');
		});

		test('should show error message when the arb file has no locale', async () => {
			// Arrange
			const sourceFileUri = getDocUri('input_incorrect_no_locale.arb.txt');
			// Write content to the temporary file
			await vscode.workspace.fs.writeFile(vscode.Uri.file(tempFilePath), await vscode.workspace.fs.readFile(sourceFileUri));

			await vscode.workspace.openTextDocument(tempFilePath).then(async doc => {
				await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('arbtools.sortArbFile');
			});

			// Assert
			assert.equal(errorMessage, '@@locale key not found.');
		});

		test('should show error message when the arb file has incorrect json format', async () => {
			// Arrange
			const sourceFileUri = getDocUri('input_incorrect_json_format.arb.txt');
			// Write content to the temporary file
			await vscode.workspace.fs.writeFile(vscode.Uri.file(tempFilePath), await vscode.workspace.fs.readFile(sourceFileUri));

			await vscode.workspace.openTextDocument(tempFilePath).then(async doc => {
				await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('arbtools.sortArbFile');
			});

			// Assert
			assert.equal(errorMessage, 'Failed to parse ARB file.');
		});
	});

	suite('With wrong extension', () => {
		setup(async () => {
			// Create a temporary file path within the workspace
			const tempFileName = 'temp_' + Date.now() + '.text';
			tempFilePath = getDocPath(tempFileName);
			const ext = vscode.extensions.getExtension('owl-studio.arbtools')!;
			await ext.activate();
		});

		teardown(async () => {
			await vscode.workspace.fs.delete(vscode.Uri.file(tempFilePath));
		});

		test('should show error message', async () => {
			// Arrange
			const sourceFileUri = getDocUri('input_correct.arb.txt');
			// Write content to the temporary file
			await vscode.workspace.fs.writeFile(vscode.Uri.file(tempFilePath), await vscode.workspace.fs.readFile(sourceFileUri));
			// Open the temporary file in the editor

			await vscode.workspace.openTextDocument(tempFilePath).then(async doc => {
				await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('arbtools.sortArbFile');
			});

			// Assert
			assert.equal(errorMessage, 'Current file is not an ARB file.');
		});
	});
});