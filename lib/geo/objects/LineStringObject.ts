import { DocumentProperty } from "editor/DocumentProperty";
import { GeoJson } from "geo/GeoJson";
import { FeatureCollection } from "geojson";
import { GeoObject } from "../GeoObject";

export class LineStringObject extends GeoObject {
    public constructor(feature: GeoJSON.Feature, guid?: string) {
        if (feature.geometry.type !== "LineString") {
            throw new Error("Feature geometry must be of type LineString.");
        }
        super("LineString", feature, guid);
        this.updateProperty(
            new DocumentProperty(
                "__meta_num_points",
                this._getCoordinates().length,
                {
                    type: "number",
                    readonly: true,
                    displayName: "Number of Points",
                }
            )
        );
        this.updateProperty(
            new DocumentProperty("__meta_length", this.totalLength, {
                type: "number",
                readonly: true,
                units: "meters",
                displayName: "Length",
            })
        );
    }

    public override get isValid(): boolean {
        return super.isValid && this._getCoordinates().length > 1;
    }

    public override move(deltaLat: number, deltaLon: number): void {
        this._setCoordinates(
            this._getCoordinates().map(([lon, lat]) => [
                lon + deltaLon,
                lat + deltaLat,
            ])
        );
    }

    public get totalLength(): number {
        const geo = new GeoJson({
            features: [this._feature],
        } as FeatureCollection);
        const len = geo.totalLength();
        if (len) {
            return parseFloat(len.toFixed(2));
        }
        return 0;
    }

    private _getCoordinates(): [number, number][] {
        if (this._feature.geometry.type === "LineString") {
            return this._feature.geometry.coordinates as [number, number][];
        } else {
            throw new Error("Geometry type is not LineString.");
        }
    }

    private _setCoordinates(coordinates: [number, number][]): void {
        if (this._feature.geometry.type === "LineString") {
            this._feature.geometry.coordinates = coordinates;
        } else {
            throw new Error("Geometry type is not LineString.");
        }
    }
}
