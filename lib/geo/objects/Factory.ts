import { DocumentObject } from "../../editor/DocumentObject";
import { PointObject } from "./PointObject";
import { LineStringObject } from "./LineStringObject";

export class Factory {
    public static createPoint(feature: GeoJSON.Feature): PointObject {
        return new PointObject(feature);
    }
    public static createLineString(feature: GeoJSON.Feature): LineStringObject {
        return new LineStringObject(feature);
    }

    public static createFeature(feature: GeoJSON.Feature): DocumentObject {
        switch (feature.geometry.type) {
            case "Point":
                return this.createPoint(feature);
            case "LineString":
                return this.createLineString(feature);
            default:
                throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
        }
    }
}

export const factory = new Factory();
