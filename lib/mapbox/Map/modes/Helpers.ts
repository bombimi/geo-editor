import { point } from "@turf/helpers";
import { Feature, GeoJsonProperties, Point, Position } from "geojson";
import { groupBy } from "lodash-es";
import { Point as MapboxGLPoint } from "mapbox-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { VertexStyle } from "./EditStyles";

export type EDITOR_FEATURE_TYPE =
    | "VERTEX"
    | "MIDPOINT"
    | "MAIN_LINE"
    | "FLOATING_LINE";

export function makePoint(
    coordinates: Position,
    properties: GeoJsonProperties = VertexStyle,
    type: string,
    index: number
): Feature<Point, GeoJsonProperties> {
    return point(coordinates, {
        ...properties,
        __line_editor_index: index,
        __line_editor_type: type,
    }) as Feature<Point, GeoJsonProperties>;
}

export function getFeatureAtScreenLocation(
    geoSource: GeoJsonSource,
    point: MapboxGLPoint,
    includeFeatures: EDITOR_FEATURE_TYPE[] = ["MIDPOINT", "VERTEX", "MAIN_LINE"]
): Feature | undefined {
    let features = geoSource.featuresAtScreenLocation(point);
    let result: Feature | undefined = undefined;

    if (features.length) {
        // exclude the floating line feature
        features = features.filter((f) => {
            const type = f.properties?.__line_editor_type;
            return includeFeatures.includes(type);
        });

        if (features.length) {
            // prefer vertex and midpoint features over the main line feature
            const groupedFeatures = groupBy(features, (f) => {
                return f.properties?.__line_editor_type;
            });

            for (const type of includeFeatures) {
                if (groupedFeatures[type]?.length) {
                    result = groupedFeatures[type][0];
                    break;
                }
            }
        }
    }
    return result;
}
