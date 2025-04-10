import { EditorEvent } from "./EditorEvent";

export abstract class Property {
    public onChange = new EditorEvent();
    public onDelete = new EditorEvent();

    constructor(
        private _name: string,
        private _type: string
    ) {}

    public set name(name: string) {
        this._name = name;
        this.onChange.raise(this);
    }

    public get name(): string {
        return this._name;
    }

    public get type(): string {
        return this._type;
    }

    public abstract get value(): any;
    public abstract set value(value: any);
}
