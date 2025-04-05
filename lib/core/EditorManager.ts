import { Editor } from "./Editor";

export class EditorManager {
    private _editors = new Map<string, Editor>();

    public add(editor: Editor): void {
        if (this._editors.has(editor.guid)) {
            throw new Error(`Editor with GUID ${editor.guid} already exists`);
        }
        this._editors.set(editor.guid, editor);
    }

    public remove(editor: Editor): void {
        if (!this._editors.has(editor.guid)) {
            throw new Error(`Editor with GUID ${editor.guid} does not exist`);
        }
        this._editors.delete(editor.guid);
    }

    public find(guid: string): Editor | undefined {
        return this._editors.get(guid);
    }
}

export const editorManager = new EditorManager();
