import { uuidv4 } from "./Utils";

export abstract class Document {
    protected _guid = uuidv4();

    public get guid(): string {
        return this._guid;
    }

    public abstract open(blob: Blob, type: string, name: string): Promise<void>;
    public abstract save(): Promise<Blob>;
    public abstract get name(): string;
    public abstract get type(): string;
}
