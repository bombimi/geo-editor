import { Feature } from "geojson";
import { DocumentObject, DocumentPropertyEvent } from "../editor/DocumentObject";
import {
    DocumentProperty,
    DocumentPropertyMetadata,
    DocumentPropertyType,
} from "../editor/DocumentProperty";
import { camelCaseToReadable } from "ui-lib/Utils";

function getPropertyType(name: string): DocumentPropertyType {
    switch (name) {
        case "stroke-width":
        case "stroke-opacity":
            return "number";

        case "stroke":
            return "color";

        default:
            return "string";
    }
}

function getPropertyMetadata(name: string): DocumentPropertyMetadata {
    switch (name) {
        case "stroke-width":
            return { min: 0, step: 1 };
        case "stroke-opacity":
            return { min: 0, max: 1, step: 0.1 };
        case "stroke":
            return { pattern: "^#[0-9A-Fa-f]{6}$" }; // Hex color pattern
        default:
            return {};
    }
}

export abstract class GeoObject extends DocumentObject {
    public constructor(protected _feature: Feature) {
        const name = _feature.properties?.name ?? _feature.properties?.id ?? "";
        const properties: DocumentProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push(
                    new DocumentProperty(key, getPropertyType(key), value, getPropertyMetadata(key))
                );
            }
        } else {
            _feature.properties = {};
        }

        super(name, _feature.geometry.type, properties);
        this.onPropertyAdded.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyChange.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyRemoved.add(
            (e: DocumentPropertyEvent) => delete this._feature.properties![e.property.name]
        );
    }

    public override get displayType() {
        return camelCaseToReadable(this.type);
    }

    public abstract move(deltaLat: number, deltaLon: number): void;

    private _upsertProperty(name: string, value: any): void {
        this._feature.properties![name] = value;
    }

    public get feature(): Feature {
        return this._feature;
    }
}
