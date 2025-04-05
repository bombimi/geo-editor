import { Document } from "./Document";

export abstract class DocumentProvider {
    public abstract get name(): string;
    public abstract fileTypes(): string[];
    public abstract openDocument(file: File, name: string): Promise<Document>;
}
