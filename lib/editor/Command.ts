import { camelCaseToReadable } from "ui-lib/Utils";
import { Document } from "./Document";

export abstract class Command {
    private readonly guid: string = crypto.randomUUID();

    constructor(public readonly name: string) {}

    public get displayName(): string {
        return camelCaseToReadable(this.name);
    }

    public getGuid(): string {
        return this.guid;
    }

    public abstract do(document: Document): void;
    public abstract undo(document: Document): void;
}
