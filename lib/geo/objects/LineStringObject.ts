import { GeoObject } from "../GeoObject";

export class LineStringObject extends GeoObject {
    public constructor(feature: GeoJSON.Feature) {
        if (feature.geometry.type !== "LineString") {
            throw new Error("Feature geometry must be of type LineString.");
        }
        super(feature);
    }

    public override move(deltaLat: number, deltaLon: number): void {
        if (this._feature.geometry.type === "LineString") {
            this._feature.geometry.coordinates = this._feature.geometry.coordinates.map(
                ([lon, lat]) => [lon + deltaLon, lat + deltaLat]
            );
        } else {
            throw new Error("Geometry type is not LineString.");
        }
    }
}
