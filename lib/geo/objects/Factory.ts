import { DocumentObject } from "../../editor/DocumentObject";
import { PointObject } from "./PointObject";
import { LineStringObject } from "./LineStringObject";

export class Factory {
    public static createPoint(feature: GeoJSON.Feature, parent?: DocumentObject): PointObject {
        return new PointObject(feature, parent);
    }
    public static createLineString(
        feature: GeoJSON.Feature,
        parent?: DocumentObject
    ): LineStringObject {
        return new LineStringObject(feature, parent);
    }

    public static createFeature(feature: GeoJSON.Feature, parent: DocumentObject): DocumentObject {
        switch (feature.geometry.type) {
            case "Point":
                return this.createPoint(feature, parent);
            case "LineString":
                return this.createLineString(feature, parent);
            default:
                throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
        }
    }
}

export const factory = new Factory();
