import { DocumentObject } from "./DocumentObject";

export class SelectionSet {
    private _selection: Set<DocumentObject> = new Set<DocumentObject>();

    public add(object: DocumentObject): void {
        this._selection.add(object);
    }

    public remove(object: DocumentObject): void {
        this._selection.delete(object);
    }

    public clear(): void {
        this._selection.clear();
    }

    public get(): DocumentObject[] {
        return Array.from(this._selection);
    }
}
