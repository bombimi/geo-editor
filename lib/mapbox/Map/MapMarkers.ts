import { Feature, Geometry } from "geojson";
import { MarkerOptions } from "mapbox-gl";
import { MapboxMap } from "./MapboxMap";
import {
    PointMarker,
    PointMarkerDragEndEvent,
    PointMarkerEvent,
} from "./PointMarker";

export class MapMarkers {
    private _pointFeatures: Feature[] = [];
    private _markers: PointMarker[] = [];

    constructor(private _map: MapboxMap) {}

    public setSelectionSet(selectionSet: string[]) {
        for (const marker of this._markers) {
            marker.setSelected(selectionSet.includes(marker.guid));
        }
    }

    private _pushPointGeometry(
        geometry: Geometry,
        properties: any,
        id: number
    ) {
        this._pointFeatures.push({
            type: "Feature",
            id,
            geometry,
            properties,
        });
    }

    private _addMarkers(
        geojson: GeoJSON.FeatureCollection,
        selectionSet: string[]
    ) {
        if (!this._map || !this._map.mapboxGL) {
            console.error("Mapbox map is not initialized.");
            return;
        }

        const processPointGeometry = (
            geometry: Geometry,
            properties: any,
            index: number
        ) => {
            if (geometry.type === "Point") {
                this._pushPointGeometry(geometry, properties, index);
            }

            if (geometry.type === "MultiPoint") {
                geometry.coordinates.forEach((coordinatePair) => {
                    this._pushPointGeometry(
                        {
                            type: "Point",
                            coordinates: coordinatePair,
                        },
                        properties || {},
                        index
                    );
                });
            }

            if (geometry.type === "GeometryCollection") {
                geometry.geometries.forEach((geometry) => {
                    processPointGeometry(geometry, properties, index);
                });
            }
        };

        geojson.features.forEach((feature, i) => {
            const { geometry, properties } = feature;
            processPointGeometry(geometry, properties, i);
        });

        if (this._pointFeatures.length === 0) {
            return;
        }

        const DEFAULT_DARK_FEATURE_COLOR = "#555";
        const DEFAULT_LIGHT_FEATURE_COLOR = "#e8e8e8";
        const DEFAULT_SATELLITE_FEATURE_COLOR = "#00f900";

        this._pointFeatures.map((point) => {
            let defaultColor = DEFAULT_DARK_FEATURE_COLOR; // Default feature color
            let defaultSymbolColor = "#fff";

            const activeStyle = "Satellite Streets"; //context.storage.get("style");

            // Adjust the feature color for certain styles to help visibility
            switch (activeStyle) {
                case "Satellite Streets":
                    defaultColor = DEFAULT_SATELLITE_FEATURE_COLOR;
                    defaultSymbolColor = "#fff";
                    break;
                // case "Dark":
                //     defaultColor = DEFAULT_LIGHT_FEATURE_COLOR;
                //     defaultSymbolColor = DEFAULT_DARK_FEATURE_COLOR;
                //     break;
                default:
                    defaultColor = DEFAULT_DARK_FEATURE_COLOR;
                    defaultSymbolColor = "#fff";
            }

            // If the Feature Object contains styling then use that, otherwise use our default feature color.
            const color =
                (point.properties && point.properties["marker-color"]) ||
                defaultColor;
            const symbolColor =
                (point.properties && point.properties["symbol-color"]) ||
                defaultSymbolColor;

            let scale = 6;
            if (point.properties && point.properties["marker-size"]) {
                if (point.properties["marker-size"] === "small") {
                    scale = 1.6;
                }

                if (point.properties["marker-size"] === "large") {
                    scale = 2.2;
                }
            }

            let symbol = "circle";
            if (
                point.properties &&
                point.properties["marker-symbol"] !== undefined
            ) {
                symbol = point.properties["marker-symbol"];
            }

            const marker = new PointMarker(
                {
                    color,
                    scale,
                    symbol,
                    symbolColor,
                } as MarkerOptions,
                point.properties?.name || "",
                point.properties?.__meta_guid || ""
            )
                .setLngLat((point.geometry as any).coordinates)
                .onClick((e: PointMarkerEvent) => {
                    this._map._dispatchEvent("object-selected", e.marker.guid);
                })
                .onDragEnd((e: PointMarkerDragEndEvent) => {
                    this._map._dispatchEvent("object-moved", {
                        object: e.guid,
                        deltaLon: e.deltaLon,
                        deltaLat: e.deltaLat,
                    });
                })
                .addTo(this._map.mapboxGL!);

            marker.setSelected(selectionSet.includes(marker.guid));
            marker.getElement().addEventListener("mouseover", () => {
                marker
                    .getElement()
                    .style.setProperty("cursor", "pointer", "important");
            });

            marker.getElement().addEventListener("touchstart", () => {});

            // Update the dot in the Marker for Dark base map style
            // if (activeStyle === "Dark")
            //     d3.selectAll(".mapboxgl-marker svg circle").style("fill", "#555", "important");

            this._markers.push(marker);
        });
    }
}
