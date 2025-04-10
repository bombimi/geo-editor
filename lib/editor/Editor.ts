import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";
import { SelectionSet } from "./SelectionSet";
import { getGeoDocumentProviders } from "../geo/GeoDocumentProviders";
import { Document } from "./Document";
import { editorManager } from "./EditorManager";
import { EditorEvent } from "./EditorEvent";

export type UndoChangedArgs = {
    canUndo: boolean;
    canRedo: boolean;
};
export class Editor {
    public onUndoChanged = new EditorEvent();
    public readonly guid: string = crypto.randomUUID();

    private _providers = getGeoDocumentProviders();
    private _undoBuffer = new UndoBuffer();
    private _document: Document | null = null;
    private _selectionSet: SelectionSet = new SelectionSet();

    constructor(document: Document) {
        this._document = document;
        editorManager.add(this);
    }

    get document() {
        return this._document;
    }

    get selectionSet() {
        return this._selectionSet;
    }

    dispose() {
        editorManager.remove(this);
    }

    get providers() {
        return this._providers;
    }

    public undo() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        console.log("Undoing command", this._document.name);
        const command = this._undoBuffer.back();
        if (command) {
            command.undo(this._document);
        }
        this._raiseUndoChanged();
    }

    public redo() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        console.log("Redoing command", this._document.name);
        const command = this._undoBuffer.forward();
        if (command) {
            command.do(this._document);
        }
        this._raiseUndoChanged();
    }

    public applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        console.log("Applying command", command.name, this._document.name);
        command.do(this._document);
        this._undoBuffer.push(command);
        this._raiseUndoChanged();
    }

    private _raiseUndoChanged() {
        this.onUndoChanged.raise({
            canUndo: this._undoBuffer.canGoBack(),
            canRedo: this._undoBuffer.canGoForward(),
        } as UndoChangedArgs);
    }
}
