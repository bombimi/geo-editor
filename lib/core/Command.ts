import { Document } from "./Document";
import { Modifier } from "./Modifier";
import { SelectionSet } from "./SelectionSet";

export abstract class Command {
    private readonly guid: string = crypto.randomUUID();

    public getGuid(): string {
        return this.guid;
    }

    public abstract execute(
        document: Document,
        selection: SelectionSet | null,
        manipulator: Modifier | null
    ): void;

    public abstract undo(): void;
    public abstract redo(): void;
}
/*  */
