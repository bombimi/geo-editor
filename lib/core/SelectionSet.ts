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

    public get(): string[] {
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
            selected: this.get(),
        } as SelectionSetChangedEvent);
        this._logSelection();
    }

    private _logSelection(): void {
        console.log("SelectionSet:", this._selection);
    }
}
