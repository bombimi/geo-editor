import { Feature } from "geojson";
import { DocumentProperty } from "../../editor/DocumentProperty";
import { GeoObject } from "../GeoObject";

export class PointObject extends GeoObject {
    public constructor(feature: Feature, guid?: string) {
        if (feature.geometry.type !== "Point") {
            throw new Error("Feature geometry must be of type Point.");
        }
        super(feature, guid);
        this._setProperties();
    }

    public override move(deltaLat: number, deltaLon: number): void {
        console.log("Moving PointObject", deltaLat, deltaLon);
        if (this._feature.geometry.type === "Point") {
            const [lon, lat] = this._getCoordinates();
            this._feature.geometry.coordinates = [lon + deltaLon, lat + deltaLat];
            this._setProperties();
        } else {
            throw new Error("Geometry type is not Point.");
        }
        this.onChanged.raise(this);
    }

    private _getCoordinates(): [number, number] {
        if (this._feature.geometry.type === "Point") {
            return this._feature.geometry.coordinates as [number, number];
        }
        throw new Error("Geometry type is not Point.");
    }

    private _setProperties(): void {
        const [lon, lat] = this._getCoordinates();
        this.updateProperty(
            new DocumentProperty("Latitude", lat, { type: "number", readonly: true })
        );
        this.updateProperty(
            new DocumentProperty("Longitude", lon, { type: "number", readonly: true })
        );
    }
}
