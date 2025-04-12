export type DocumentPropertyType = "string" | "number" | "boolean" | "array" | "object"; // Types of properties for document objects

export type DocumentPropertyOptions = {
    readonly?: boolean; // Optional flag to indicate if the property is read-only
};

export class DocumentProperty {
    private _readonly = false; // Flag to indicate if the property is read-only

    constructor(
        private _name: string,
        private _type: DocumentPropertyType,
        private _value: any,
        options: DocumentPropertyOptions = {}
    ) {
        this.readonly = options?.readonly ?? false; // Set the read-only flag based on options or default to false
    }

    // Create a clone of the property with the same name, type, and value
    public clone(): DocumentProperty {
        return new DocumentProperty(this._name, this._type, this._value, {
            readonly: this._readonly,
        });
    }

    // Get the name of the property
    get name() {
        return this._name;
    }

    // Get the type of the property
    get type() {
        return this._type;
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
        return this._readonly; // Get the read-only flag for the property
    }

    // Set the read-only flag for the property
    set readonly(readonly: boolean) {
        this._readonly = readonly;
    }
}
