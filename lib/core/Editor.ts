import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";
import { SelectionSet } from "./SelectionSet";
import { Modifier } from "./Modifier";
import { getGeoDocumentProviders } from "../geo/GeoDocumentProviders";
import { Document } from "./Document";

export class Editor {
    private _providers = getGeoDocumentProviders();
    private _undoBuffer = new UndoBuffer();
    private _document: Document | null = null;
    private _selectionSet: SelectionSet = new SelectionSet();
    private _currentManipulator: Modifier | null = null;

    public get providers() {
        return this._providers;
    }

    public set document(document: Document | null) {
        this._document = document;
    }

    public applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        command.execute(this._document, this._selectionSet, this._currentManipulator);
        this._undoBuffer.push(command);
    }
}
