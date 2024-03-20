import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const prefix = 'numbered-clipboards';
    const stateKey = prefix + '-clipboards';

    const disposables: vscode.Disposable[] = [];

    const getClipboards = () => {
        try {
            let str = context.globalState.get(stateKey);
            if (str && typeof str === 'string') {
                return JSON.parse(str);
            } else {
                return Array(10).fill('');
            }
        } catch (e) {
            return Array(10).fill('');
        }
    };

    const setClipboard = (i: number, val: string) => {
        const clipboards = getClipboards();
        clipboards[i] = val;
        context.globalState.update(stateKey, JSON.stringify(clipboards));
    };

    const clearAll = () => {
        context.globalState.update(stateKey, JSON.stringify(Array(10).fill('')));
    };

    const getSelections = (editor: vscode.TextEditor) => {
        return editor.selections.map(selection => editor.document.getText(selection)).join('\n');
    };

    // Register commands for copying
    for (let i = 0; i < 10; i++) {
        disposables.push(
            vscode.commands.registerCommand(`numbered-clipboards.copy${i}`, () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                const selectedText = getSelections(editor);
                if (selectedText !== undefined && selectedText !== '') {
                    setClipboard(i, selectedText);
                }
            })
        );
    }

    for (let i = 0; i < 10; i++) {
        disposables.push(
            vscode.commands.registerCommand(`numbered-clipboards.cut${i}`, () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                const selectedText = getSelections(editor);
                if (selectedText !== undefined && selectedText !== '') {
                    setClipboard(i, selectedText);
                    editor.edit(editBuilder => {
                        editor.selections.forEach(selection => editBuilder.delete(selection));
                    });
                }
            })
        );
    }

    for (let i = 0; i < 10; i++) {
        disposables.push(
            vscode.commands.registerCommand(`numbered-clipboards.paste${i}`, async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                const clipboards = getClipboards();

                await editor.edit(editBuilder => {
                    editor.selections.forEach(selection => {
                        if (!selection.isEmpty) {
                            editBuilder.replace(selection, clipboards[i]);
                        } else {
                            editBuilder.insert(selection.active, clipboards[i]);
                        }
                    });
                });

                const newSelections = editor.selections.map(selection => {
                    return new vscode.Selection(selection.end, selection.end);
                });
                editor.selections = newSelections;
            })
        );
    }

    disposables.push(
        vscode.commands.registerCommand(`numbered-clipboards.clear-all`, () => {
            clearAll();
        })
    );

    disposables.push(
        vscode.commands.registerCommand(`numbered-clipboards.append-to-system-clipboard`, async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            let clipboardContent = await vscode.env.clipboard.readText();
            editor.selections.forEach(selection => {
                const selectedText = editor.document.getText(selection);
                clipboardContent += '\n' + selectedText;
            });
            vscode.env.clipboard.writeText(clipboardContent);
        })
    );

    context.subscriptions.push(...disposables);
}

// This method is called when your extension is deactivated
export function deactivate() {}
