import * as vscode from 'vscode';

export function mocks() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No open text editor
    }

    var selection = editor.selection;
    var text = editor.document.getText(selection);
    editor.edit(editBuilder => {
        console.log("current line = " + text);
        const regex = /([a-zA-Z]+)(\(([a-zA-Z ,.]*)\)\s?\(([a-zA-Z ,.]*)\))/i;
        var t = text.match(regex);
        if (!t) {
            return;
        }
        var protos = t[1] + "Func func" + t[2] + "\n" + t[1] + "Count int32";
        editBuilder.replace(selection, protos);

        var params = t[3].split(',');
        var paramsNames = [];
        for (var i = 0; i < params.length; i++) {
            paramsNames[i] = params[i].trim().split(' ')[0];
        }

        var returnParams = t[4].split(',');
        var returnParamsNames = [];
        for (var i = 0; i < returnParams.length; i++) {
            returnParamsNames[i] = returnParams[i].trim();
            if (returnParams[i].includes('.')) {
                returnParamsNames[i] += "{}";
            }

            if (returnParams[i].includes('*') || returnParams[i].trim() === "error") {
                returnParamsNames[i] = 'nil';
                continue;
            }

            switch (returnParams[i]) {
                case "string":
                    returnParamsNames[i] = '""';
                    break;
                case "int":
                case "int32":
                case "int64":
                    returnParamsNames[i] = 0;
                    break;
                case "float":
                case "float32":
                case "float64":
                    returnParamsNames[i] = 0.0;
                    break;
                case "bool":
                    returnParamsNames[i] = false;
                    break;
                default:
                    break;
            }
        }

        var func = `

func (a App) ${t[1]}${t[2]} {
    atomic.AddInt32(&a.${t[1]}Count, 1)
    if a.${t[1]}Func == nil {
        return ${returnParamsNames.join(', ')}
    }
    return a.${t[1]}Func(${paramsNames.join(', ')})
}
`;

        editBuilder.insert(new vscode.Position(editor!.document.lineCount + 1, 0), func);
    });
}