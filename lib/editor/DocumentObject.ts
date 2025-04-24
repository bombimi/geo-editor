import { cloneDeep, orderBy } from "lodash-es";
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
    public guid!: string;

    public onChanged = new EditorEvent<DocumentObject>();
    public onDeleted = new EditorEvent<DocumentObject>();

    public onPropertyChanged = new EditorEvent<DocumentPropertyEvent>();
    public onPropertyAdded = new EditorEvent<DocumentPropertyEvent>();
    public onPropertyRemoved = new EditorEvent<DocumentPropertyEvent>();

    public onChildAdded = new EditorEvent<DocumentObjectChildEvent>();
    public onChildRemoved = new EditorEvent<DocumentObjectChildEvent>();

    private _children: DocumentObject[] = [];
    private _properties: DocumentProperty[] = [];
    private _selected = false;

    public init(
        type: DocumentObjectType,
        properties: DocumentProperty[] = [],
        guid?: string
    ) {
        this.guid = guid ?? uuidv4();
        const guidProp = properties.find((prop) => prop.name === "__meta_guid");
        if (guidProp) {
            this.guid = guidProp.value;
        }

        for (const prop of properties) {
            this.updateProperty(prop);
        }

        this.updateProperty(
            new DocumentProperty("__meta_type", type, {
                type: "string",
                readonly: true,
                displayName: "Type",
            })
        );
        this.updateProperty(
            new DocumentProperty("__meta_guid", this.guid, {
                type: "string",
                readonly: true,
                displayName: "Unique Id",
            })
        );

        this._attachEvents(this);
    }

    public serialize(): any {
        return {
            guid: this.guid,
            properties: this._properties.map((prop) =>
                cloneDeep(prop.serialize())
            ),
            children: this._children.map((child) =>
                cloneDeep(child.serialize())
            ),
        };
    }

    public addProperty(prop: DocumentProperty): void {
        this._properties.push(prop);
        this.onPropertyAdded.raise({ property: prop, object: this });
    }

    public getProperty(name: string): DocumentProperty | undefined {
        return this._findProperty(name);
    }

    public updateProperty(prop: DocumentProperty): void {
        const existingProp = this._findProperty(prop.name);
        if (existingProp) {
            this._properties = this._properties.filter(
                (p) => p.name !== prop.name
            );
            this._properties.push(prop.clone());
            this.onPropertyChanged.raise({ property: prop, object: this });
        } else {
            // If not found, add the new property
            this.addProperty(prop);
        }
    }

    public removeProperty(prop: DocumentProperty): void {
        this._properties = this._properties.filter((p) => p.name !== prop.name);
        this.onPropertyRemoved.raise({ property: prop, object: this });
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
        return this._findProperty("__meta_type")?.value;
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
        this._children = orderBy(this._children, ["type", "guid"], ["asc"]);
        this.onChildAdded.raise({ child, object: this });
        this._attachEvents(child);
        return child;
    }

    public removeChild(guid: string): DocumentObject | undefined {
        const child = this.getChild(guid);
        if (child) {
            this._children = this._children.filter((c) => c.guid !== guid);
            this.onChildRemoved.raise({ child, object: this });
            this._detachEvents(child);
            return child;
        }
        return undefined;
    }

    // Find a child document object by its GUID
    public getChild(guid: string): DocumentObject | undefined {
        return this._children.find((child) => child.guid === guid);
    }

    private _attachEvents(object: DocumentObject) {
        if (object !== this) {
            object.onChanged.add(this._raiseOnChanged);
        }
        object.onDeleted.add(this._raiseOnChanged);
        object.onPropertyAdded.add(this._raiseOnChanged);
        object.onPropertyChanged.add(this._raiseOnChanged);
        object.onPropertyRemoved.add(this._raiseOnChanged);
        object.onChildAdded.add(this._raiseOnChanged);
        object.onChildRemoved.add(this._raiseOnChanged);
    }

    private _detachEvents(object: DocumentObject) {
        if (object !== this) {
            object.onChanged.remove(this._raiseOnChanged);
        }
        object.onDeleted.remove(this._raiseOnChanged);
        object.onPropertyAdded.remove(this._raiseOnChanged);
        object.onPropertyChanged.remove(this._raiseOnChanged);
        object.onPropertyRemoved.remove(this._raiseOnChanged);
        object.onChildAdded.remove(this._raiseOnChanged);
        object.onChildRemoved.remove(this._raiseOnChanged);
    }

    private _findProperty(name: string): DocumentProperty | undefined {
        return this._properties.find((property) => property.name === name);
    }

    private readonly _raiseOnChanged = () => this.onChanged.raise(this);
}
