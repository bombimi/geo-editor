import { Command } from "editor/Command";
import { Document } from "editor/Document";
import { DocumentObject } from "editor/DocumentObject";

export class DeleteObjectCommand extends Command {
    private _oldObjects: DocumentObject[] = [];

    constructor(selectionSet: string[]) {
        super("DeleteObject", selectionSet);
    }

    public override get description(): string {
        return `Delete ${this._selectionSet.join(", ")}`;
    }

    public do(document: Document): void {
        for (const guid of this._selectionSet) {
            const child = document.getChild(guid);
            if (child) {
                document.removeChild(guid);
                this._oldObjects.push(child);
            }
        }
    }

    public undo(document: Document): void {
        for (const child of this._oldObjects) {
            document.addChild(child);
        }
        this._oldObjects = [];
    }

    public override clearSelection(): boolean {
        return true;
    }
}
