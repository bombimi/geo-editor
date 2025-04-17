import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./MapboxMap.style";

import { Map as MapboxGLMap, MapMouseEvent, MarkerOptions } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { merge } from "lodash-es";
import { watch } from "../../ui-utils/watch";
import { Location } from "../../geo/GeoJson";
import { Feature, Geometry } from "geojson";
import { PointMarker, PointMarkerDragEndEvent, PointMarkerEvent } from "./PointMarker";
import { BaseElement } from "../../ui-lib/BaseElement";
import { uuidv4 } from "editor/Utils";
import { MapLayers } from "./MapLayers";

export type MapConfig = ReturnType<typeof makeConfig>;

export type MapConfigKeys = {
    mapbox: string;
};

function defaultMapConfigKeys(): MapConfigKeys {
    return {
        mapbox: "pk.eyJ1IjoibWFydGluLXNsYXRlciIsImEiOiJjbTkzeHBqaTkwcW5sMmxxMW5oeTA2cjk2In0.VJ1BVbaN59wDTq6J0BLYIw",
    };
}

function makeConfig(apiKeys: MapConfigKeys = defaultMapConfigKeys()) {
    return {
        map: {
            zoom: 3,
            center: [0, 0],
            pitch: 0,
            bearing: 0,
        },
        style: "mapbox://styles/mapbox/standard-satellite",
        projection: "globe",
        keys: apiKeys,
    };
}

@customElement("ds-map")
export class MapboxMap extends BaseElement {
    static override styles = [styles];

    @property({ type: Object }) config: MapConfig = makeConfig();
    @property({ type: Array }) selectionSet: string[] = [];

    private _map?: MapboxGLMap;
    private _config = this.config;
    private _pointFeatures: Feature[] = [];
    private _geoJsonLoaded = false;
    private _markers: PointMarker[] = [];
    private _hoveredFeatureId: string | number | undefined;
    private _idToGuid = new Map<number, string>();

    @state() protected _cssLoaded = false;

    @query("#map-container") protected _mapContainer?: HTMLElement;

    @watch("config")
    _onConfigChange() {
        this._config = merge(makeConfig(), this.config);

        this._initMap();
    }

    @watch("_cssLoaded")
    _onCssLoaded() {
        this._initMap();
    }

    @watch("selectionSet")
    _onSelectionSetChange() {
        for (const marker of this._markers) {
            marker.setSelected(this.selectionSet.includes(marker.guid));
        }
    }

    public zoomIn() {
        if (this._map) {
            this._map.zoomIn();
        }
    }

    public zoomOut() {
        if (this._map) {
            this._map.zoomOut();
        }
    }

    public fitBounds(ne: Location, sw: Location) {
        if (this._map) {
            const bb = new mapboxgl.LngLatBounds(
                new mapboxgl.LngLat(sw.lon, sw.lat),
                new mapboxgl.LngLat(ne.lon, ne.lat)
            );
            this._map.fitBounds(bb, {
                padding: 20,
            });
        }
    }

    public setGeoJsonLayer(geo: GeoJSON.FeatureCollection) {
        if (!this._map) {
            return;
        }
        if (this._geoJsonLoaded) {
            this._pointFeatures = [];
            for (const layer of MapLayers) {
                this._map.removeLayer(layer.id);
            }
            this._map.removeSource("map-data");
            for (const marker of this._markers) {
                marker.remove();
            }
            this._markers = [];
            this._idToGuid.clear();
            this._geoJsonLoaded = false;
        }

        const filteredFeatures = geo.features.filter((feature) => feature.geometry !== null);
        let id = 0;
        for (const feature of filteredFeatures) {
            feature.id = id++;
            this._idToGuid.set(feature.id, feature.properties?.__meta_guid || uuidv4());
        }

        this._map.addSource("map-data", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: filteredFeatures,
            },
        });

        for (const layer of MapLayers) {
            this._map.addLayer(layer);
        }

        this._map?.on("mousemove", "map-data-line-select", (e: MapMouseEvent) => {
            if (this._map) {
                if (this._hoveredFeatureId) {
                    this._map.setFeatureState(
                        { source: "map-data", id: this._hoveredFeatureId },
                        { selected: false }
                    );
                    this._hoveredFeatureId = undefined;
                }
                if (e.features && e.features.length) {
                    this._hoveredFeatureId = e.features[0].id;
                    this._map.setFeatureState(
                        { source: "map-data", id: this._hoveredFeatureId as number },
                        { selected: true }
                    );
                    this._map.getCanvas().style.cursor = "pointer";
                }
                // // this._map.getCanvas().style.cursor = features && features.length ? "pointer" : "";
            }
        });

        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        this._map.on("mouseleave", "map-data-line-select", () => {
            if (this._map) {
                if (this._hoveredFeatureId !== undefined) {
                    this._map.setFeatureState(
                        { source: "map-data", id: this._hoveredFeatureId as number },
                        { selected: false }
                    );
                }
                this._hoveredFeatureId = undefined;
                this._map.getCanvas().style.cursor = "";
            }
        });

        this._map.on("click", "map-data-line-select", (e: MapMouseEvent) => {
            if (this._map && e.features && e.features.length) {
                this._dispatchEvent(
                    "object-selected",
                    this._idToGuid.get(e.features[0].id as number)
                );
            }
        });
        this._addMarkers(geo);
        this._geoJsonLoaded = true;
    }

    private _pushPointGeometry(geometry: Geometry, properties: any, id: number) {
        this._pointFeatures.push({
            type: "Feature",
            id,
            geometry,
            properties,
        });
    }

    private _addMarkers(geojson: GeoJSON.FeatureCollection) {
        if (!this._map) {
            return;
        }

        const processPointGeometry = (geometry: Geometry, properties: any, index: number) => {
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
            const color = (point.properties && point.properties["marker-color"]) || defaultColor;
            const symbolColor =
                (point.properties && point.properties["symbol-color"]) || defaultSymbolColor;

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
            if (point.properties && point.properties["marker-symbol"] !== undefined) {
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
                    this._dispatchEvent("object-selected", e.marker.guid);
                })
                .onDragEnd((e: PointMarkerDragEndEvent) => {
                    this._dispatchEvent("object-moved", {
                        object: e.guid,
                        deltaLon: e.deltaLon,
                        deltaLat: e.deltaLat,
                    });
                })
                .addTo(this._map!);

            marker.setSelected(this.selectionSet.includes(marker.guid));
            marker.getElement().addEventListener("mouseover", () => {
                marker.getElement().style.setProperty("cursor", "pointer", "important");
            });

            marker.getElement().addEventListener("touchstart", () => {});

            // Update the dot in the Marker for Dark base map style
            // if (activeStyle === "Dark")
            //     d3.selectAll(".mapboxgl-marker svg circle").style("fill", "#555", "important");

            this._markers.push(marker);
        });
    }

    private async _loadImage(name: string) {
        const url = `/map-icons/${name}.png`;
        return new Promise((resolve, reject) => {
            this._map?.loadImage(url, (error, image) => {
                if (error) {
                    reject(error);
                } else if (image) {
                    this._map?.addImage(name, image);
                    resolve(image);
                }
            });
        });
    }

    private async _initMapbox(): Promise<void> {
        return new Promise((resolve, _reject) => {
            if (!this._mapContainer || !this._cssLoaded || !this._config) {
                return;
            }

            this._map = new MapboxGLMap({
                container: this._mapContainer,
                style: this._config.style,
                projection: this._config.projection,
                center: [this._config?.map.center[0], this._config?.map.center[1]],
                zoom: this._config.map.zoom,
                pitch: this._config.map.pitch,
            });
            this._map.on("load", () => {
                resolve();
            });
        });
    }

    private async _initMap() {
        if (!this._mapContainer || !this._cssLoaded || !this._config) {
            return;
        }

        if (this._config.keys) {
            mapboxgl.accessToken = this._config.keys.mapbox;
        }
        if (this._map) {
            this._map.remove();
            this._map = undefined;
        }

        await this._initMapbox();

        const icons = ["point"];
        await Promise.all(icons.map((icon) => this._loadImage(icon)));

        this.dispatchEvent(new CustomEvent("map-loaded", { bubbles: true, composed: true }));

        //   this._disableRightMouseDragRotate();
    }

    override firstUpdated() {
        if (this._mapContainer) {
            this._mapContainer.addEventListener("dragover", (e: Event) => {
                e.preventDefault();
            });
            //        container.addEventListener('drop', (ev) => this._handleDrop(ev));

            this._initMap();
        }
    }

    override render() {
        return html` <link
                href="/assets/mapbox-gl.css"
                rel="stylesheet"
                @load=${() => (this._cssLoaded = true)}
            />
            <div id="map-container"></div>`;
    }
}
