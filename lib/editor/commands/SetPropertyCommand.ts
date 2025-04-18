import { Command, CommandBaseOptions } from "../Command";
import { Document } from "../Document";
import { DocumentProperty } from "../DocumentProperty";

export type SetPropertyCommandArgs = CommandBaseOptions & {
    selectionSet: string[];
    oldProperties?: any[];
    property: DocumentProperty;
};

export class SetPropertyCommand extends Command {
    private _oldProps = new Map<string, DocumentProperty | undefined>();
    private _prop: DocumentProperty;

    constructor(args: SetPropertyCommandArgs) {
        super(args);
        if (args.property instanceof DocumentProperty) {
            this._prop = args.property;
        } else {
            this._prop = DocumentProperty.deserialize(args.property);
        }
        if (args.oldProperties) {
            for (const op of args.oldProperties) {
                this._oldProps.set(op.guid, DocumentProperty.deserialize(op.property));
            }
        }
    }

    public override get name(): string {
        return "SetPropertyCommand";
    }

    public override get description(): string {
        return `Set property '${this._prop.name}' to ${this._prop.value}`;
    }

    public do(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            if (feature) {
                const curProp = feature.getProperty(this._prop.name);
                if (curProp) {
                    this._oldProps.set(guid, curProp.clone());
                }
                if (this._prop.value !== undefined) {
                    feature.updateProperty(this._prop);
                } else {
                    feature.removeProperty(this._prop);
                }
            }
        }
    }
    public undo(document: Document): void {
        for (const guid of this._selectionSet) {
            const feature = document.getChild(guid);
            const oldProp = this._oldProps.get(guid);
            if (feature) {
                if (oldProp) {
                    // Restore the old property value
                    feature.updateProperty(oldProp);
                } else {
                    // If the old property is not found, remove the property from the feature
                    feature.removeProperty(this._prop);
                }
            }
        }
        this._oldProps.clear();
    }

    public override serialize() {
        const oldProperties = Array.from(this._oldProps.entries()).map(([guid, prop]) => {
            return { guid, property: prop?.serialize() };
        });

        return Object.assign(super.serialize(), {
            property: this._prop.serialize(),
            oldProperties,
        });
    }
}
