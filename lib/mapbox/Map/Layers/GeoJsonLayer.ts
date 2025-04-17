import { FeatureCollection } from "geojson";
import { groupBy } from "lodash-es";

export class GeoJsonLayer {
    constructor() {}

    public set geojson(collection: FeatureCollection) {
        // clean up incoming geojson
        const features = collection.features.filter((feature) => feature.geometry);

        // split up by type
        const featuresByType = groupBy(features, (feature) => feature.geometry.type);

        if (featuresByType["Point"]) {
            console.log("Points", featuresByType["Point"]);
        }
        if (featuresByType["MultiPoint"]) {
            console.log("MultiPoints", featuresByType["MultiPoint"]);
        }
        if (featuresByType["LineString"]) {
            console.log("Lines", featuresByType["LineString"]);
        }
        if (featuresByType["MultiLineString"]) {
            console.log("Lines", featuresByType["LineString"]);
        }
        if (featuresByType["Polygon"]) {
            console.log("Polygons", featuresByType["Polygon"]);
        }
        if (featuresByType["MultiPolygon"]) {
            console.log("MultiPolygons", featuresByType["MultiPolygon"]);
        }
        if (featuresByType["MultiPoint"]) {
            console.log("MultiPoints", featuresByType["MultiPoint"]);
        }
    }
}
