import { EditorEvent } from "./EditorEvent";
import { uuidv4 } from "./Utils";

export type DocumentObjectPropertyType = "string" | "number" | "boolean" | "array" | "object"; // Types of properties for document objects

export type DocumentObjectProperty = {
    name: string; // Name of the property
    type: string; // Type of the property (e.g., "string", "number", "boolean")
    value: any;
};

export type DocumentObjectType = "root" | string;

export class DocumentObject {
    public onChange = new EditorEvent(); // Event triggered when the document object changes
    public onDelete = new EditorEvent(); // Event triggered when the document object is deleted

    public onPropertyChange = new EditorEvent(); // Event triggered when a property changes
    public onPropertyAdded = new EditorEvent(); // Event triggered when a property is added
    public onPropertyRemoved = new EditorEvent(); // Event triggered when a property is removed

    public onChildAdded = new EditorEvent(); // Event triggered when a child is added
    public onChildRemoved = new EditorEvent(); // Event triggered when a child is removed

    public readonly guid: string = uuidv4(); // Unique identifier for the document object

    private _children: DocumentObject[] = []; // Array of child document objects
    private _properties: DocumentObjectProperty[] = []; // Array of properties for the document object
    private _selected = false;

    constructor(
        name: string,
        type: DocumentObjectType = "root",
        parent: DocumentObject | null = null,
        properties: DocumentObjectProperty[] = []
    ) {
        this.updateProperty({ name: "name", type: "string", value: name });
        this.updateProperty({ name: "type", type: "string", value: type });
        this.updateProperty({ name: "__guid", type: "string", value: this.guid });

        for (const prop of properties) {
            this.updateProperty(prop); // Update properties for the document object
        }

        if (parent) {
            parent.addChild(this); // If a parent is provided, add this object as a child to the parent
        }
    }

    public addProperty(prop: DocumentObjectProperty): void {
        this._properties.push(prop); // Add a property to the document object
    }

    public getProperty(name: string): DocumentObjectProperty | undefined {
        return this._findProperty(name); // Get a property by its name
    }

    public updateProperty(prop: DocumentObjectProperty): void {
        const existingProp = this._findProperty(prop.name); //
        if (existingProp) {
            existingProp.value = prop.value;
            this.onPropertyChange.raise(existingProp);
        } else {
            // If not found, add the new property
            this.addProperty(prop);
            this.onPropertyAdded.raise(prop);
        }
    }

    public get selected(): boolean {
        return this._selected;
    }

    public get name() {
        return this._findProperty("name")?.value;
    }

    public get type() {
        return this._findProperty("type")?.value;
    }

    public get children(): DocumentObject[] {
        return this._children; // Get the array of child document objects
    }

    public get properties(): DocumentObjectProperty[] {
        return this._properties; // Get the array of properties for the document object
    }

    public addChild(child: DocumentObject): void {
        this._children.push(child); // Add a child document object to the array
    }

    public removeChild(child: DocumentObject): void {
        this._children = this._children.filter((c) => c !== child); // Remove a child document object from the array
    }

    public findChild(guid: string): DocumentObject | undefined {
        return this._children.find((child) => child.guid === guid); // Find a child document object by its GUID
    }

    private _findProperty(name: string): DocumentObjectProperty | undefined {
        return this._properties.find((property) => property.name === name); // Find a property by its name
    }
}
