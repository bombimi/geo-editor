import { circle } from "@turf/circle";
import { distance } from "@turf/distance";
import { DocumentProperty } from "editor/DocumentProperty";
import { Feature } from "geojson";
import { GeoObject } from "../GeoObject";

const CIRCLE_RADIUS_PROPERTY = "__geo_editor_circle_radius";
const CIRCLE_LAT_PROPERTY = "__geo_editor_circle_lat";
const CIRCLE_LNG_PROPERTY = "__geo_editor_circle_lng";

export function checkIsCircle(feature: Feature) {
    return (
        feature.geometry &&
        feature.geometry.type === "Polygon" &&
        feature.properties &&
        feature.properties[CIRCLE_RADIUS_PROPERTY] !== undefined &&
        feature.properties[CIRCLE_LAT_PROPERTY] !== undefined &&
        feature.properties[CIRCLE_LNG_PROPERTY] !== undefined
    );
}

export function circleFromTwoPoints(
    center: number[],
    other: number[],
    guid?: string
): CircleObject {
    const radius = distance(center, other);
    return circleFromCenterAndRadius(center, radius, guid);
}

export function circleFromCenterAndRadius(
    center: number[],
    radius: number,
    guid?: string
): CircleObject {
    const feature = circle(center, radius);
    feature.properties = feature.properties || {};
    feature.properties[CIRCLE_RADIUS_PROPERTY] = radius;
    feature.properties[CIRCLE_LAT_PROPERTY] = center[1];
    feature.properties[CIRCLE_LNG_PROPERTY] = center[0];

    return new CircleObject(feature, guid);
}

export class CircleObject extends GeoObject {
    public constructor(feature: Feature, guid?: string) {
        if (!checkIsCircle(feature)) {
            throw new Error("Feature is not a Circle.");
        }

        super("Circle", feature, guid);

        this.onPropertyChanged.add((e) => {
            if (
                [
                    CIRCLE_RADIUS_PROPERTY,
                    CIRCLE_LAT_PROPERTY,
                    CIRCLE_LNG_PROPERTY,
                ].includes(e.property.name)
            ) {
                this._featureIsDirty = true;
            }
        });
    }

    public override updateFeature(feature: Feature): void {
        const newFeature = new CircleObject(feature);
        this.center = newFeature.center;
        this.radius = newFeature.radius;
        this.onChanged.raise(this);
    }

    public get radius(): number {
        return this.getProperty(CIRCLE_RADIUS_PROPERTY)?.value;
    }

    public set radius(value: number) {
        this.updateProperty(
            new DocumentProperty(CIRCLE_RADIUS_PROPERTY, value)
        );
        this._featureIsDirty = true;
    }

    public get center(): number[] {
        return [
            this.getProperty(CIRCLE_LNG_PROPERTY)?.value,
            this.getProperty(CIRCLE_LAT_PROPERTY)?.value,
        ];
    }

    public set center(value: number[]) {
        this.updateProperty(
            new DocumentProperty(CIRCLE_LNG_PROPERTY, value[0])
        );
        this.updateProperty(
            new DocumentProperty(CIRCLE_LAT_PROPERTY, value[1])
        );
        this._featureIsDirty = true;
    }

    public override move(deltaLat: number, deltaLon: number): void {
        console.log("Moving CircleObject", deltaLat, deltaLon);
        const center = this.center;
        this.center = [center[0] + deltaLon, center[1] + deltaLat];
        this.onChanged.raise(this);
        this._featureIsDirty = true;
    }

    protected override _updateFeature(): void {
        const newFeature = circle(this.center, this.radius);
        this._feature.geometry = newFeature.geometry;
    }
}
