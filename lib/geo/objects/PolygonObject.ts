import { Feature } from "geojson";
import { GeoObject } from "../GeoObject";

export class PolygonObject extends GeoObject {
    public constructor(feature: Feature, guid?: string) {
        if (feature.geometry.type !== "Polygon") {
            throw new Error("Feature geometry must be of type Polygon.");
        }
        super("Polygon", feature, guid);
    }

    public override move(_deltaLat: number, _deltaLon: number): void {
        throw new Error("Move operation is not supported for PolygonObject.");
    }
}
