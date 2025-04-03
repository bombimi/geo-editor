import { kml, gpx } from "@mapbox/togeojson";

import { bbox } from "@turf/bbox";
import center from "@turf/center";
import { length } from "@turf/length";
import { Feature, FeatureCollection, GeoJsonProperties, LineString } from "geojson";

export type GeoSourceType = "kml" | "geojson" | "gpx";

export const GeoSourceTypes: GeoSourceType[] = ["kml", "geojson", "gpx"];

export function cleanGeoJson(geo: FeatureCollection) {
    const toRemove = new Set<Feature>();
    for (const feature of geo.features) {
        if (feature.geometry.type === "LineString") {
            if (
                feature.geometry.coordinates.length === 1 &&
                isNaN(feature.geometry.coordinates[0] as unknown as number)
            ) {
                toRemove.add(feature);
            }
        }
    }

    geo.features = geo.features.filter((x) => !toRemove.has(x));
    return geo;
}
/**
 * GEOJson container of features
 */
export class GeoJson {
    constructor(public readonly features: GeoJSON.FeatureCollection) {}

    //-----------------------------------------------------------------------------
    // Creating from different formats
    //-----------------------------------------------------------------------------
    public static async createFromUrl(
        type: GeoSourceType,
        url: string
    ): Promise<GeoJson | undefined> {
        if (type && url && url.length > 0) {
            const response = await window.fetch(url);
            if (response.status === 200) {
                const text = await response.text();
                return GeoJson.createFromString(type, text);
            }
        }
        return undefined;
    }

    public static createFromString(type: GeoSourceType, text: string): GeoJson | undefined {
        switch (type) {
            case "kml":
                return this.createFromKMLString(text);
            case "geojson":
                return this.createFromGeoJsonString(text);
            case "gpx":
                return this.createFromGPXString(text);
        }
    }

    public static createFromGPXString(text: string): GeoJson | undefined {
        const geojson = gpx(
            new DOMParser().parseFromString(text, "text/xml")
        ) as GeoJSON.FeatureCollection;
        return GeoJson.createFromGeoJson(geojson);
    }

    public static createFromKMLString(text: string): GeoJson | undefined {
        const geojson = kml(
            new DOMParser().parseFromString(text, "text/xml")
        ) as GeoJSON.FeatureCollection;
        return GeoJson.createFromGeoJson(geojson);
    }

    public static createFromGeoJsonString(text: string): GeoJson | undefined {
        const geojson = JSON.parse(text) as GeoJSON.FeatureCollection;
        return GeoJson.createFromGeoJson(geojson);
    }

    public static createFromGeoJson(features: GeoJSON.FeatureCollection): GeoJson | undefined {
        return new GeoJson(features);
    }

    //-----------------------------------------------------------------------------
    // Utility functions
    //-----------------------------------------------------------------------------

    public center() {
        const c = center(this.features);
        return {
            lon: c.geometry.coordinates[0],
            lat: c.geometry.coordinates[1],
        };
    }

    public bbox() {
        const b = bbox(this.features);
        return {
            sw: makeLocation(b[1], b[0]),
            ne: makeLocation(b[3], b[2]),
        };
    }

    /**
     * Total length of the survey in meters
     */
    public totalLength(): number | undefined {
        if (!this.features || this.features.features.length === 0) {
            return undefined;
        }
        let totalLength = 0;
        for (const f of this.features.features) {
            if (f.geometry.type === "LineString") {
                totalLength += length(f as Feature<LineString, GeoJsonProperties>, {
                    units: "metres",
                });
            }
        }
        return totalLength;
    }

    public maxDepth(): number | undefined {
        if (!this.features || this.features.features.length === 0) {
            return undefined;
        }

        let maxDepth = undefined;
        for (const f of this.features.features) {
            if (f.geometry.type === "LineString") {
                const ls = f as Feature<LineString, GeoJsonProperties>;
                for (const p of ls.geometry.coordinates) {
                    if (!maxDepth || p[2] < maxDepth) {
                        maxDepth = p[2];
                    }
                }
            }
        }
        return maxDepth;
    }
}
