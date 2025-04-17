import { DocumentObject } from "./DocumentObject";

export abstract class Document extends DocumentObject {
    public abstract open(blob: Blob, type: string, name: string): Promise<void>;
    public abstract save(): Promise<string>;
}
