import { Command } from "../Command";
import { Document } from "../Document";
import { DocumentProperty } from "../DocumentProperty";

export class SetPropertyCommand extends Command {
    private _oldProps = new Map<string, DocumentProperty | undefined>(); // Store the old property value for undo

    constructor(
        selectionSet: string[],
        private _prop: DocumentProperty
    ) {
        super("SetProperty", selectionSet);
    }

    public override do(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            if (feature) {
                this._oldProps.set(guid, feature.getProperty(this._prop.name)?.clone());
                feature.updateProperty(this._prop);
            }
        }
    }
    public override undo(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            const oldProp = this._oldProps.get(guid);
            if (feature && oldProp) {
                // Restore the old property value
                feature.updateProperty(oldProp);
            }
        }
    }
}
