import { Command } from "../Command";
import { Document } from "../Document";
import { DocumentProperty } from "../DocumentProperty";

export class SetPropertyCommand extends Command {
    private _oldProps = new Map<string, DocumentProperty | undefined>();

    constructor(
        selectionSet: string[],
        private _prop: DocumentProperty
    ) {
        super("SetProperty", selectionSet);
    }

    public override get description(): string {
        return `Set property ${this._prop.name} to ${this._prop.value}`;
    }

    public do(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            if (feature) {
                this._oldProps.set(guid, feature.getProperty(this._prop.name)?.clone());
                feature.updateProperty(this._prop);
            }
        }
    }
    public undo(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            const oldProp = this._oldProps.get(guid);
            if (feature && oldProp) {
                // Restore the old property value
                feature.updateProperty(oldProp);
            }
        }
        this._oldProps.clear();
    }
}
