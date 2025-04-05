import { Document } from "./Document";

export abstract class DocumentProvider {
    constructor(public readonly id: string) {}

    public abstract get name(): string;
    public abstract fileTypes(): string[];
    public abstract openDocument(blob: Blob, name: string): Promise<Document>;
}
