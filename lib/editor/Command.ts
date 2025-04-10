import { Document } from "./Document";
import { SelectionSet } from "./SelectionSet";

export abstract class Command {
    private readonly guid: string = crypto.randomUUID();

    constructor(public readonly name: string) {}

    public getGuid(): string {
        return this.guid;
    }

    public abstract do(document: Document): void;
    public abstract undo(document: Document): void;
}
/*  */
