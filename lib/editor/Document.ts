import { DocumentObject } from "./DocumentObject";
import { EditorEvent } from "./EditorEvent";
import { uuidv4 } from "./Utils";

export abstract class Document {
    protected _guid = uuidv4();
    protected _root: DocumentObject | null = null; // Root document object

    public readonly onChanged = new EditorEvent(); // Event triggered when the document changes

    public get guid(): string {
        return this._guid;
    }

    public get root(): DocumentObject | null {
        return this._root;
    }
    public set root(root: DocumentObject | null) {
        this._root = root;
        this.onChanged.raise({
            document: this,
            object: this._root,
        });
    }

    public abstract open(blob: Blob, type: string, name: string): Promise<void>;
    public abstract save(): Promise<Blob>;
    public abstract get name(): string;
    public abstract get type(): string;
}
