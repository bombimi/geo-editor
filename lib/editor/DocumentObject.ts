import { DocumentProperty } from "./DocumentProperty";
import { EditorEvent } from "./EditorEvent";
import { uuidv4 } from "./Utils";

export type DocumentObjectType = "root" | string;

export type DocumentPropertyEvent = {
    property: DocumentProperty; // Property that triggered the event
    object: DocumentObject; // Document object associated with the event
};

export type DocumentObjectChildEvent = {
    child: DocumentObject; // Child document object that triggered the event
    object: DocumentObject; // Document object associated with the event
};

export class DocumentObject {
    public onChange = new EditorEvent<DocumentObject>(); // Event triggered when the document object changes
    public onDelete = new EditorEvent<DocumentObject>(); // Event triggered when the document object is deleted

    public onPropertyChange = new EditorEvent<DocumentPropertyEvent>(); // Event triggered when a property changes
    public onPropertyAdded = new EditorEvent<DocumentPropertyEvent>(); // Event triggered when a property is added
    public onPropertyRemoved = new EditorEvent<DocumentPropertyEvent>(); // Event triggered when a property is removed

    public onChildAdded = new EditorEvent<DocumentObjectChildEvent>(); // Event triggered when a child is added
    public onChildRemoved = new EditorEvent<DocumentObjectChildEvent>(); // Event triggered when a child is removed

    public readonly guid: string = uuidv4(); // Unique identifier for the document object

    private _children: DocumentObject[] = []; // Array of child document objects
    private _properties: DocumentProperty[] = []; // Array of properties for the document object
    private _selected = false;

    constructor(name: string, type: DocumentObjectType, properties: DocumentProperty[] = []) {
        this.updateProperty(new DocumentProperty("name", "string", name));
        this.updateProperty(new DocumentProperty("type", "string", type, { readonly: true }));
        this.updateProperty(
            new DocumentProperty("__guid", "string", this.guid, { readonly: true })
        );

        for (const prop of properties) {
            this.updateProperty(prop); // Update properties for the document object
        }
    }

    public addProperty(prop: DocumentProperty): void {
        this._properties.push(prop); // Add a property to the document object
        this.onPropertyAdded.raise({ property: prop, object: this });
    }

    public getProperty(name: string): DocumentProperty | undefined {
        return this._findProperty(name); // Get a property by its name
    }

    public updateProperty(prop: DocumentProperty): void {
        const existingProp = this._findProperty(prop.name); //
        if (existingProp) {
            existingProp.value = prop.value;
            this.onPropertyChange.raise({ property: existingProp, object: this });
        } else {
            // If not found, add the new property
            this.addProperty(prop);
        }
    }

    public get selected(): boolean {
        return this._selected;
    }

    public get name() {
        return this._findProperty("name")?.value;
    }

    public get displayName() {
        return this.name;
    }

    public get type() {
        return this._findProperty("type")?.value;
    }

    public get displayType() {
        return this.type;
    }

    public get children(): DocumentObject[] {
        return this._children;
    }

    public get properties(): DocumentProperty[] {
        return this._properties;
    }

    public getObjectsFromGuids(guids: string[]): DocumentObject[] {
        const objects: DocumentObject[] = [];
        if (this._children) {
            for (const guid of guids) {
                const obj = this.getChild(guid);
                if (obj) {
                    objects.push(obj);
                }
            }
        }
        return objects;
    }

    public addChild(child: DocumentObject): DocumentObject {
        this._children.push(child);
        this.onChildAdded.raise({ child, object: this });
        return child;
    }

    public removeChild(child: DocumentObject): void {
        this._children = this._children.filter((c) => c !== child);
        this.onChildRemoved.raise({ child, object: this });
    }

    // Find a child document object by its GUID
    public getChild(guid: string): DocumentObject | undefined {
        return this._children.find((child) => child.guid === guid);
    }

    private _findProperty(name: string): DocumentProperty | undefined {
        return this._properties.find((property) => property.name === name);
    }
}
