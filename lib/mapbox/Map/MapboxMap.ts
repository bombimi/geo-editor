import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./MapboxMap.style";

import { uuidv4 } from "editor/Utils";
import { Feature, Geometry } from "geojson";
import { merge } from "lodash-es";
import mapboxgl, {
    GeoJSONSource,
    Map as MapboxGLMap,
    MapMouseEvent,
    MarkerOptions,
} from "mapbox-gl";

import { Location } from "../../geo/GeoJson";
import { BaseElement } from "../../ui-lib/BaseElement";
import { watch } from "../../ui-utils/watch";
import { InteractionMode } from "./InteractionMode";
import { MapLayers } from "./MapLayers";
import { CreatePointMode } from "./modes/CreatePointMode";
import { SelectMode } from "./modes/SelectMode";
import {
    PointMarker,
    PointMarkerDragEndEvent,
    PointMarkerEvent,
} from "./PointMarker";

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

export type InteractionModes =
    | "select"
    | "draw-point"
    | "draw-line-string"
    | "draw-polygon"
    | "draw-circle"
    | "draw-rectangle";

@customElement("ds-map")
export class MapboxMap extends BaseElement {
    static override styles = [styles];

    @property({ type: Object }) config: MapConfig = makeConfig();
    @property({ type: Array }) selectionSet: string[] = [];
    @property({ type: String }) mode: InteractionModes = "select";

    public mapboxGL?: MapboxGLMap;
    private _config = this.config;
    private _pointFeatures: Feature[] = [];
    private _geoJsonLoaded = false;
    private _markers: PointMarker[] = [];

    // The setFeatureState API requires a unique ID for each feature and that
    // appears to be a number. So we need to keep track of the mapping between
    // the GUID and the ID. The ID is used to set the feature state and the GUID
    // is used to identify the feature in the selection set.
    private _currentFeatureID = 0;
    private _idToGuid = new Map<number, string>();
    private _guidToId = new Map<string, number>();

    private _interactionMode?: InteractionMode;

    @state() protected _cssLoaded = false;

    @query("#map-container") protected _mapContainer?: HTMLElement;

    @watch("mode")
    _onModeChange() {
        if (this._interactionMode) {
            this._interactionMode.onDeactivate();
        }
        this._interactionMode = this._createMode(this.mode);
        this._interactionMode.onActivate();
    }

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
        for (const [key, value] of this._guidToId.entries()) {
            const selected = this.selectionSet.includes(key);
            if (this.mapboxGL) {
                this.mapboxGL.setFeatureState(
                    { source: "map-data", id: value },
                    { selected }
                );
            }
        }
    }

    public featureGuidFromID(id: number): string | undefined {
        return this._idToGuid.get(id);
    }

    public zoomIn() {
        if (this.mapboxGL) {
            this.mapboxGL.zoomIn();
        }
    }

    public zoomOut() {
        if (this.mapboxGL) {
            this.mapboxGL.zoomOut();
        }
    }

    public fitBounds(ne: Location, sw: Location) {
        if (this.mapboxGL) {
            const bb = new mapboxgl.LngLatBounds(
                new mapboxgl.LngLat(sw.lon, sw.lat),
                new mapboxgl.LngLat(ne.lon, ne.lat)
            );
            this.mapboxGL.fitBounds(bb, {
                padding: 20,
            });
        }
    }

    private _onMouseMove(e: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onMouseMove(e);
        }
    }

    private _createMode(mode: InteractionModes): InteractionMode {
        switch (mode) {
            case "select":
                return new SelectMode(this);
            case "draw-point":
                return new CreatePointMode(this);
            case "draw-line-string":
                return new SelectMode(this);
            case "draw-polygon":
                return new SelectMode(this);
            case "draw-circle":
                return new SelectMode(this);
            case "draw-rectangle":
                return new SelectMode(this);
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }
    }

    //---------------------------------------------------------------
    // Map Event Handlers
    //---------------------------------------------------------------

    private _onMouseLeave(event: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onMouseLeave(event);
        }
    }

    private _onClick(e: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onClick(e);
        }
    }

    //---------------------------------------------------------------
    // GeoJSON Layer
    //---------------------------------------------------------------

    private _updateGeoJsonLayer(geo: GeoJSON.FeatureCollection) {
        if (this.mapboxGL) {
            (this.mapboxGL.getSource("map-data") as GeoJSONSource)?.setData(
                geo
            );
        }
    }

    public setGeoJsonLayer(geo: GeoJSON.FeatureCollection) {
        if (!this.mapboxGL) {
            return;
        }

        const features = geo.features;

        // add feature to id mapping for new objects
        for (const feature of features) {
            const guid = feature.properties?.__meta_guid;
            console.assert(guid !== undefined, "Feature does not have a guid");
            if (!this._guidToId.has(feature.properties?.__meta_guid)) {
                const guid = feature.properties?.__meta_guid || uuidv4();
                feature.id = this._currentFeatureID++;
                this._idToGuid.set(feature.id, guid);
                this._guidToId.set(guid, feature.id);
            }
        }

        // just update the existing layer and avoid the full redraw if we are initialized
        if (this._geoJsonLoaded) {
            this._updateGeoJsonLayer(geo);
            return;
        }

        this.mapboxGL.addSource("map-data", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: features,
            },
        });

        for (const layer of MapLayers) {
            this.mapboxGL.addLayer(layer);
            this.mapboxGL?.on("mousemove", layer.id, (e: MapMouseEvent) =>
                this._onMouseMove(e)
            );
            this.mapboxGL?.on("mouseleave", layer.id, (e: MapMouseEvent) =>
                this._onMouseLeave(e)
            );
            this.mapboxGL?.on("click", layer.id, (e: MapMouseEvent) =>
                this._onClick(e)
            );
        }

        // this._addMarkers(geo);
        this._geoJsonLoaded = true;
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

    private _addMarkers(geojson: GeoJSON.FeatureCollection) {
        if (!this.mapboxGL) {
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
                    this._dispatchEvent("object-selected", e.marker.guid);
                })
                .onDragEnd((e: PointMarkerDragEndEvent) => {
                    this._dispatchEvent("object-moved", {
                        object: e.guid,
                        deltaLon: e.deltaLon,
                        deltaLat: e.deltaLat,
                    });
                })
                .addTo(this.mapboxGL!);

            marker.setSelected(this.selectionSet.includes(marker.guid));
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

    private async _loadImage(name: string) {
        const url = `/map-icons/${name}.png`;
        return new Promise((resolve, reject) => {
            this.mapboxGL?.loadImage(url, (error, image) => {
                if (error) {
                    reject(error);
                } else if (image) {
                    this.mapboxGL?.addImage(name, image);
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

            this.mapboxGL = new MapboxGLMap({
                container: this._mapContainer,
                style: this._config.style,
                projection: this._config.projection,
                center: [
                    this._config?.map.center[0],
                    this._config?.map.center[1],
                ],
                zoom: this._config.map.zoom,
                pitch: this._config.map.pitch,
            });

            //this.mapboxGL.on("draw.create", (e) => this._createFeature(e));
            //this._map.on("draw.delete", this._delete);
            //this.mapboxGL.on("draw.update", (e) => this._updateFeature(e));

            this.mapboxGL.on("click", (e: MapMouseEvent) => {
                if (this._interactionMode) {
                    this._interactionMode.onClick(e);
                }
            });
            this.mapboxGL.on("load", () => {
                resolve();
            });
        });
    }

    private _createFeature(e: any) {
        const features = e.features;
        for (const feature of features) {
            this._dispatchEvent("object-created", feature);
        }
    }

    private _updateFeature(e: any) {
        const features = e.features;
        for (const feature of features) {
            this._dispatchEvent("object-updated", feature);
        }
    }

    private async _initMap() {
        if (!this._mapContainer || !this._cssLoaded || !this._config) {
            return;
        }

        if (this._config.keys) {
            mapboxgl.accessToken = this._config.keys.mapbox;
        }
        if (this.mapboxGL) {
            this.mapboxGL.remove();
            this.mapboxGL = undefined;
        }

        await this._initMapbox();

        const icons = ["point"];
        await Promise.all(icons.map((icon) => this._loadImage(icon)));

        this.dispatchEvent(
            new CustomEvent("map-loaded", { bubbles: true, composed: true })
        );

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
