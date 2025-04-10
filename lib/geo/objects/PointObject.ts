import { Feature } from "geojson";
import { GeoObject } from "../GeoObject";
import { DocumentObject } from "../../editor/DocumentObject";

export class PointObject extends GeoObject {
    public constructor(feature: Feature, parent?: DocumentObject) {
        if (feature.geometry.type !== "Point") {
            throw new Error("Feature geometry must be of type Point.");
        }
        super(feature, parent);
    }

    public override move(deltaLat: number, deltaLon: number): void {
        if (this._feature.geometry.type === "Point") {
            const [lon, lat] = this._feature.geometry.coordinates;
            this._feature.geometry.coordinates = [lon + deltaLon, lat + deltaLat];
        } else {
            throw new Error("Geometry type is not Point.");
        }
    }
}
