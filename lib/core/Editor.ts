import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";
import { SelectionSet } from "./SelectionSet";
import { Manipulator } from "./Manipulator";

export abstract class DocumentProvider {
    public abstract fileTypes(): string[];
    public abstract openDocument(file: File): Document;
}

export class Editor {
    private _undoBuffer = new UndoBuffer();
    private _document: Document | null = null;
    private _selectionSet: SelectionSet = new SelectionSet();
    private _currentManipulator: Manipulator | null = null;

    public applyCommand(command: Command) {
        if (this._document === null) {
            throw new Error("No document loaded.");
        }
        command.execute(this._document, this._selectionSet, this._currentManipulator);
        this._undoBuffer.push(command);
    }
}
