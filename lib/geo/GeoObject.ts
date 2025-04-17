import { Feature } from "geojson";
import { DocumentObject, DocumentPropertyEvent } from "../editor/DocumentObject";
import { DocumentProperty, DocumentPropertyMetadata } from "../editor/DocumentProperty";
import { camelCaseToReadable } from "ui-lib/Utils";
import { WellKnownProperties } from "./WellKnownProperties";

function getPropertyMetadata(name: string): DocumentPropertyMetadata {
    return WellKnownProperties[name] ?? { type: "string" };
}

export abstract class GeoObject extends DocumentObject {
    public constructor(protected _feature: Feature) {
        const properties: DocumentProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push(new DocumentProperty(key, value, getPropertyMetadata(key)));
            }
        } else {
            _feature.properties = {};
        }

        super(_feature.geometry.type, properties);
        this.onPropertyAdded.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyChanged.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyRemoved.add(
            (e: DocumentPropertyEvent) => delete this._feature.properties![e.property.name]
        );
    }

    public override serialize() {
        return this._feature;
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
