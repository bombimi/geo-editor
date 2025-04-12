import { Feature } from "geojson";
import { DocumentObject } from "../editor/DocumentObject";
import { DocumentProperty } from "../editor/DocumentProperty";

export abstract class GeoObject extends DocumentObject {
    public constructor(protected _feature: Feature) {
        const name = _feature.properties?.name ?? _feature.properties?.id ?? "";
        const properties: DocumentProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push(new DocumentProperty(key, "string", value));
            }
        }

        super(name, _feature.geometry.type, properties);
    }

    public abstract move(deltaLat: number, deltaLon: number): void;
}
