import { cloneDeep } from "lodash-es";

export type DocumentPropertyType = "color" | "string" | "number";
export type DocumentPropertyUnits = "meters";

export type DocumentPropertyMetadata = {
    type: DocumentPropertyType; // Type of the property (e.g., string, number, color)
    readonly?: boolean; // Flag to indicate if the property is read-only
    units?: DocumentPropertyUnits; // Units for the property value
    min?: number; // Minimum value for the property (if applicable)
    max?: number; // Maximum value for the property (if applicable)
    step?: number; // Step value for the property (if applicable)
    pattern?: string; // Pattern for validating the property value (if applicable)
    displayName?: string; // Display name for the property (if applicable)
};

export class DocumentProperty {
    constructor(
        private _name: string,
        private _value: any,
        private _metadata: DocumentPropertyMetadata
    ) {}

    // Create a clone of the property with the same name, type, and value
    public clone(): DocumentProperty {
        return new DocumentProperty(this._name, cloneDeep(this._value), cloneDeep(this._metadata));
    }

    public serialize(): any {
        return {
            name: this._name,
            value: this._value,
            metadata: this._metadata,
        };
    }

    public static deserialize(data: any): DocumentProperty {
        return new DocumentProperty(data.name, data.value, {
            type: data.metadata.type,
            readonly: data.metadata.readonly,
            units: data.metadata.units,
            min: data.metadata.min,
            max: data.metadata.max,
            step: data.metadata.step,
            pattern: data.metadata.pattern,
            displayName: data.metadata.displayName,
        });
    }

    // Get the name of the property
    get name() {
        return this._name;
    }

    // Get the type of the property
    get type() {
        return this._metadata.type;
    }

    // Get the value of the property
    get value() {
        return this._value;
    }

    // Set a new value for the property
    set value(newValue: any) {
        this._value = newValue;
    }

    // Get the read-only flag for the property
    get readonly() {
        return this._metadata.readonly ?? false;
    }

    // Set the read-only flag for the property
    set readonly(readonly: boolean) {
        this._metadata.readonly = readonly;
    }

    get units() {
        return this._metadata.units;
    }

    set unit(unit: DocumentPropertyUnits) {
        this._metadata.units = unit;
    }

    get metadata() {
        return this._metadata;
    }

    get displayName() {
        return this._metadata.displayName ?? this._name;
    }
}
