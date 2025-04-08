import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";
import { SelectionSet } from "./SelectionSet";
import { Modifier } from "./Modifier";
import { getGeoDocumentProviders } from "../geo/GeoDocumentProviders";
import { Document } from "./Document";
import { editorManager } from "./EditorManager";

export class Editor {
    public readonly guid: string = crypto.randomUUID();
    private _providers = getGeoDocumentProviders();
    private _undoBuffer = new UndoBuffer();
    private _document: Document | null = null;
    private _selectionSet: SelectionSet = new SelectionSet();
    private _currentManipulator: Modifier | null = null;

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

    applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        command.execute(this._document, this._selectionSet, this._currentManipulator);
        this._undoBuffer.push(command);
    }
}
