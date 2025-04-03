import { UndoBuffer } from "./UndoBuffer";
import { Command } from "./Command";

export abstract class DocumentProvider {
    public abstract fileTypes(): string[];
    public abstract openDocument(file: File): Document;
}

export class Editor {
    private UndoBuffer = new UndoBuffer();

    public applyCommand(command: Command) {
        this.UndoBuffer.push(command);
        command.execute();
    }
}
