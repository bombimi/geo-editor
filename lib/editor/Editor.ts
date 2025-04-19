import { UndoBuffer, UndoBufferArgs } from "./UndoBuffer";

import { getGeoDocumentProviders } from "../geo/GeoDocumentProviders";
import { Command } from "./Command";
import { Document } from "./Document";
import { editorManager } from "./EditorManager";
import { SelectionSet } from "./SelectionSet";

export class Editor {
    public readonly guid: string = crypto.randomUUID();

    private _providers = getGeoDocumentProviders();
    private _undoBuffer = new UndoBuffer();
    private _document: Document;
    private _selectionSet: SelectionSet = new SelectionSet();

    constructor(document: Document, undoBufferArgs?: UndoBufferArgs) {
        this._document = document;
        if (undoBufferArgs) {
            this._undoBuffer = new UndoBuffer(undoBufferArgs);
        }
        editorManager.add(this);
        this._undoBuffer.onCaretChanged.add(() => {
            this.document?.onChanged.raise(this._document);
        });
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

    public selectAll() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        this._selectionSet.set(this._document.children.map((c) => c.guid));
    }

    public clearSelection() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        this._selectionSet.clear();
    }

    public undo() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        const command = this._undoBuffer.back();
        console.log("Undoing command", command.description, this._document.name);

        if (command) {
            command.undo(this._document);
        }
    }

    public redo() {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        const command = this._undoBuffer.forward();
        console.log("Redoing command", command.description, this._document.name);

        if (command) {
            command.do(this._document);
        }
    }

    public applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        console.log("Applying command", command.description, this._document.name);
        command.do(this._document);
        this._undoBuffer.push(command);
        if (command.clearSelection()) {
            this._selectionSet.clear();
        }
    }
}
