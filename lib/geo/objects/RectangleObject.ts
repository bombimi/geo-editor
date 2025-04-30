import { DocumentProperty } from "editor/DocumentProperty";
import { Feature } from "geojson";
import { GeoObject } from "../GeoObject";

const RECTANGLE_NW_LAT_PROPERTY = "__geo_editor_rectangle_nw_lat";
const RECTANGLE_NW_LNG_PROPERTY = "__geo_editor_rectangle_nw_lng";
const RECTANGLE_SE_LAT_PROPERTY = "__geo_editor_rectangle_se_lat";
const RECTANGLE_SE_LNG_PROPERTY = "__geo_editor_rectangle_se_lng";

export function checkIsRectangle(feature: Feature) {
    return (
        feature.geometry &&
        feature.geometry.type === "Polygon" &&
        feature.properties &&
        feature.properties[RECTANGLE_NW_LAT_PROPERTY] !== undefined &&
        feature.properties[RECTANGLE_NW_LNG_PROPERTY] !== undefined &&
        feature.properties[RECTANGLE_SE_LAT_PROPERTY] !== undefined &&
        feature.properties[RECTANGLE_SE_LNG_PROPERTY] !== undefined
    );
}

export function polygonFromTwoPoints(
    northWest: number[],
    southEast: number[]
): Feature {
    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [northWest[0], northWest[1]],
                    [southEast[0], northWest[1]],
                    [southEast[0], southEast[1]],
                    [northWest[0], southEast[1]],
                    [northWest[0], northWest[1]],
                ],
            ],
        },
    } as Feature;
}

export function rectangleFromTwoPoints(
    northWest: number[],
    southEast: number[],
    guid?: string
): RectangleObject {
    const feature = polygonFromTwoPoints(northWest, southEast);
    feature.properties = feature.properties || {};
    feature.properties[RECTANGLE_NW_LNG_PROPERTY] = northWest[0];
    feature.properties[RECTANGLE_NW_LAT_PROPERTY] = northWest[1];
    feature.properties[RECTANGLE_SE_LNG_PROPERTY] = southEast[0];
    feature.properties[RECTANGLE_SE_LAT_PROPERTY] = southEast[1];
    return new RectangleObject(feature, guid);
}

export class RectangleObject extends GeoObject {
    public constructor(feature: Feature, guid?: string) {
        if (!checkIsRectangle(feature)) {
            throw new Error("Feature is not a Rectangle.");
        }

        super("Rectangle", feature, guid);

        this.onPropertyChanged.add((e) => {
            if (
                [
                    RECTANGLE_NW_LAT_PROPERTY,
                    RECTANGLE_NW_LNG_PROPERTY,
                    RECTANGLE_SE_LAT_PROPERTY,
                    RECTANGLE_SE_LNG_PROPERTY,
                ].includes(e.property.name)
            ) {
                this._featureIsDirty = true;
            }
        });
    }

    public override updateFeature(feature: Feature): void {
        const newFeature = new RectangleObject(feature);
        this.northWest = newFeature.northWest;
        this.southEast = newFeature.southEast;
        this.onChanged.raise(this);
    }

    public get northWest(): number[] {
        return [
            this.getProperty(RECTANGLE_NW_LNG_PROPERTY)?.value,
            this.getProperty(RECTANGLE_NW_LAT_PROPERTY)?.value,
        ];
    }

    public set northWest(value: number[]) {
        this.updateProperty(
            new DocumentProperty(RECTANGLE_NW_LNG_PROPERTY, value[0])
        );
        this.updateProperty(
            new DocumentProperty(RECTANGLE_NW_LAT_PROPERTY, value[1])
        );
        this._featureIsDirty = true;
    }

    public get southEast(): number[] {
        return [
            this.getProperty(RECTANGLE_SE_LNG_PROPERTY)?.value,
            this.getProperty(RECTANGLE_SE_LAT_PROPERTY)?.value,
        ];
    }

    public set southEast(value: number[]) {
        this.updateProperty(
            new DocumentProperty(RECTANGLE_SE_LNG_PROPERTY, value[0])
        );
        this.updateProperty(
            new DocumentProperty(RECTANGLE_SE_LAT_PROPERTY, value[1])
        );
        this._featureIsDirty = true;
    }

    public override move(deltaLat: number, deltaLon: number): void {
        console.log("Moving RectangleObject", deltaLat, deltaLon);
        this.northWest = [
            this.northWest[0] + deltaLon,
            this.northWest[1] + deltaLat,
        ];
        this.southEast = [
            this.southEast[0] + deltaLon,
            this.southEast[1] + deltaLat,
        ];

        this.onChanged.raise(this);
        this._featureIsDirty = true;
    }

    protected override _updateFeature(): void {
        const newFeature = polygonFromTwoPoints(this.northWest, this.southEast);
        this._feature.geometry = newFeature.geometry;
    }
}
