import { Command, CommandBaseOptions } from "editor/Command";
import { Document } from "editor/Document";
import {
    createDocumentObject,
    SavedDocumentObject,
    saveDocumentObject,
} from "editor/DocumentObjectFactory";

export type DeleteObjectCommandArgs = CommandBaseOptions & {
    selectionSet: string[];
    oldObjects?: SavedDocumentObject[];
};

export class DeleteObjectCommand extends Command {
    private _oldObjects: SavedDocumentObject[] = [];

    constructor(args: DeleteObjectCommandArgs) {
        super(args);

        if (args.oldObjects) {
            this._oldObjects = args.oldObjects;
        }
    }

    public override get name(): string {
        return "DeleteObjectCommand";
    }

    public override get description(): string {
        return `Delete ${this._selectionSet.join(", ")}`;
    }

    public do(document: Document): void {
        for (const guid of this._selectionSet) {
            const child = document.getChild(guid);
            if (child) {
                document.removeChild(guid);
                this._oldObjects.push(saveDocumentObject(child));
            }
        }
    }

    public undo(document: Document): void {
        for (const child of this._oldObjects) {
            document.addChild(createDocumentObject(child));
        }
        this._oldObjects = [];
    }

    public override clearSelection(): boolean {
        return true;
    }

    public override serialize(): any {
        return Object.assign(super.serialize(), {
            oldObjects: this._oldObjects,
        });
    }
}
