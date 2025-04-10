import { Feature } from "geojson";
import { DocumentObject, DocumentObjectProperty } from "../editor/DocumentObject";

export abstract class GeoObject extends DocumentObject {
    public constructor(
        protected _feature: Feature,
        parent?: DocumentObject
    ) {
        const name = _feature.properties?.name ?? _feature.properties?.id ?? "";
        const properties: DocumentObjectProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push({
                    name: key,
                    value: value,
                    type: "string",
                });
            }
        }

        super(name, _feature.geometry.type, parent, properties);
    }

    public abstract move(deltaLat: number, deltaLon: number): void;
}
