import { Feature } from "geojson";
import { DocumentObject } from "../editor/DocumentObject";
import { DocumentProperty, DocumentPropertyType } from "../editor/DocumentProperty";
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

export abstract class GeoObject extends DocumentObject {
    public constructor(protected _feature: Feature) {
        const name = _feature.properties?.name ?? _feature.properties?.id ?? "";
        const properties: DocumentProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push(new DocumentProperty(key, getPropertyType(key), value));
            }
        }

        super(name, _feature.geometry.type, properties);
    }

    public override get displayType() {
        return camelCaseToReadable(this.type);
    }

    public abstract move(deltaLat: number, deltaLon: number): void;
}
