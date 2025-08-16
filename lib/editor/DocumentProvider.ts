import { Document } from "./Document";

export abstract class DocumentProvider {
    constructor(public readonly id: string) { }

    public abstract get type(): string;
    public abstract get fileExtension(): string;
    public abstract get displayName(): string;
    public abstract get mimeType(): string;

    public abstract get canLoadFileTypes(): string[];
    public abstract get canSaveFileType(): boolean;

    public abstract openDocument(blob: Blob, name: string): Promise<Document>;
    public abstract saveDocument(document: Document, fileType: string): Promise<string | undefined>;
}
