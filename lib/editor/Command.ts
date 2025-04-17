import { camelCaseToReadable } from "ui-lib/Utils";
import { Document } from "./Document";

export type CommandBaseOptions = {
    guid?: string;
    selectionSet: string[];
    version?: number;
};

export abstract class Command {
    private readonly _version: number = 1;
    private readonly _guid: string = crypto.randomUUID();
    protected readonly _selectionSet: string[];

    constructor(options: CommandBaseOptions) {
        this._guid = options.guid ?? crypto.randomUUID();
        this._selectionSet = options.selectionSet ?? [];
    }

    public abstract get name(): string;

    public get displayName(): string {
        return camelCaseToReadable(this.name);
    }

    public get description(): string {
        return this.displayName;
    }

    public get guid(): string {
        return this._guid;
    }

    public clearSelection(): boolean {
        return false;
    }

    public abstract do(document: Document): void;
    public abstract undo(document: Document): void;

    public serialize(): any {
        return {
            version: this._version,
            guid: this._guid,
            selectionSet: this._selectionSet,
        };
    }
}
