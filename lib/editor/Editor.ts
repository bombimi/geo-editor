import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";
import { SelectionSet } from "./SelectionSet";
import { getGeoDocumentProviders } from "../geo/GeoDocumentProviders";
import { Document } from "./Document";
import { editorManager } from "./EditorManager";

export class Editor {
    public readonly guid: string = crypto.randomUUID();

    private _providers = getGeoDocumentProviders();
    private _undoBuffer = new UndoBuffer();
    private _document: Document | null = null;
    private _selectionSet: SelectionSet = new SelectionSet();

    constructor(document: Document) {
        this._document = document;
        editorManager.add(this);
    }

    dispose() {
        editorManager.remove(this);
    }

    get document() {
        return this._document;
    }

    get selectionSet() {
        return this._selectionSet;
    }

    get undoBuffer() {
        return this._undoBuffer;
    }

    get providers() {
        return this._providers;
    }

    public undo() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        const command = this._undoBuffer.back();
        console.log("Undoing command", command.name, this._document.name);

        if (command) {
            command.undo(this._document);
        }
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
    }

    public applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        console.log("Applying command", command.name, this._document.name);
        command.do(this._document);
        this._undoBuffer.push(command);
    }
}
