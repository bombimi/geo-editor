import { isEqual } from "lodash-es";
import { EditorEvent } from "./EditorEvent";

export type SelectionSetChangedEvent = {
    selectionSet: SelectionSet;
    selected: string[];
};
export class SelectionSet {
    public onChanged = new EditorEvent();

    private _selection: Set<string> = new Set<string>();

    public get length(): number {
        return this._selection.size;
    }

    public isEqual(other: SelectionSet): boolean {
        return isEqual(this._selection, other.selectionSet);
    }

    public clone(): SelectionSet {
        const clone = new SelectionSet();
        clone.set(this.array);
        return clone;
    }

    public set(guids: string[]): void {
        this._selection.clear();
        for (const guid of guids) {
            this._selection.add(guid);
        }
        this._raiseOnChanged();
    }

    public add(guid: string): void {
        this._selection.add(guid);
        this._raiseOnChanged();
    }

    public remove(guid: string): void {
        this._selection.delete(guid);
        this._raiseOnChanged();
    }

    public clear(): void {
        this._selection.clear();
        this._raiseOnChanged();
    }

    public get selectionSet(): Set<string> {
        return this._selection;
    }

    public get array(): string[] {
        return Array.from(this._selection);
    }

    public contains(guid: string): boolean {
        return this._selection.has(guid);
    }

    public toggle(guid: string): void {
        if (this._selection.has(guid)) {
            this.remove(guid);
        } else {
            this.add(guid);
        }
    }

    private _raiseOnChanged(): void {
        this.onChanged.raise({
            selectionSet: this,
            selected: this.array,
        } as SelectionSetChangedEvent);
    }
}
