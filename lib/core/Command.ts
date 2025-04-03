import { Manipulator } from "./Manipulator";
import { SelectionSet } from "./SelectionSet";

export abstract class Command {
    private readonly guid: string = crypto.randomUUID();

    public getGuid(): string {
        return this.guid;
    }

    public abstract execute(
        document: Document,
        selection: SelectionSet | null,
        manipulator: Manipulator | null
    ): void;

    public abstract undo(): void;
    public abstract redo(): void;
}
