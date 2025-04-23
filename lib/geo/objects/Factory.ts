import { GeoObject } from "geo/GeoObject";
import { DocumentObject } from "../../editor/DocumentObject";
import { checkIsCircle, CircleObject } from "./CircleObject";
import { LineStringObject } from "./LineStringObject";
import { PointObject } from "./PointObject";
import { PolygonObject } from "./PolygonObject";

export class Factory {
    public static createPoint(
        feature: GeoJSON.Feature,
        guid?: string
    ): PointObject {
        return new PointObject(feature, guid);
    }
    public static createLineString(
        feature: GeoJSON.Feature,
        guid?: string
    ): LineStringObject {
        return new LineStringObject(feature, guid);
    }
    public static createPolygon(
        feature: GeoJSON.Feature,
        guid?: string
    ): GeoObject {
        if (checkIsCircle(feature)) {
            return new CircleObject(feature, guid);
        }
        return new PolygonObject(feature, guid);
    }

    public static createFeature(
        feature: GeoJSON.Feature,
        guid?: string
    ): DocumentObject {
        switch (feature.geometry.type) {
            case "Point":
                return this.createPoint(feature, guid);
            case "LineString":
                return this.createLineString(feature, guid);
            case "Polygon":
                return this.createPolygon(feature, guid);
            default:
                throw new Error(
                    `Unsupported geometry type: ${feature.geometry.type}`
                );
        }
    }
}

export const factory = new Factory();
