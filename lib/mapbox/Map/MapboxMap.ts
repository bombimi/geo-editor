import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./MapboxMap.style";

import { merge } from "lodash-es";
import mapboxgl, {
    Map as MapboxGLMap,
    MapMouseEvent,
    StyleSpecification,
} from "maplibre-gl";

import { checkIsCircle } from "geo/objects/CircleObject";
import { checkIsRectangle } from "geo/objects/RectangleObject";
import { Feature } from "geojson";
import { Location } from "../../geo/GeoJson";
import { BaseElement } from "../../ui-lib/BaseElement";
import { watch } from "../../ui-utils/watch";
import { GeoJsonSource } from "./GeoJsonSource";
import { InteractionMode } from "./InteractionMode";
import { CircleEditMode } from "./modes/CircleEditMode";
import { CreatePointMode } from "./modes/CreatePointMode";
import { EditSelectMode } from "./modes/EditSelectMode";
import { LineEditMode } from "./modes/LineEditMode";
import { MoveSelectMode } from "./modes/MoveSelectMode";
import { PolygonEditMode } from "./modes/PolygonEditMode";
import { RectangleEditMode } from "./modes/RectangleEditMode";
import { SelectMode } from "./modes/SelectMode";

export type MapConfig = {
    map: {
        zoom: number;
        center: number[];
        pitch: number;
        bearing: number;
    };
    style: string | StyleSpecification;
    projection: "mercator" | "globe";
    keys: MapConfigKeys;
};

export type MapCameraState = {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
};

function cameraStateEqual(
    a: MapCameraState,
    b: MapCameraState,
    epsilon = 1e-7
): boolean {
    return (
        Math.abs(a.center[0] - b.center[0]) <= epsilon &&
        Math.abs(a.center[1] - b.center[1]) <= epsilon &&
        Math.abs(a.zoom - b.zoom) <= epsilon &&
        Math.abs(a.pitch - b.pitch) <= epsilon &&
        Math.abs(a.bearing - b.bearing) <= epsilon
    );
}

export type MapConfigKeys = {
    mapbox: string;
};

function defaultMapConfigKeys(): MapConfigKeys {
    return {
        mapbox: "",
    };
}

function defaultStyle(): string | StyleSpecification {
    // Public demo style from MapLibre that supports vector rendering.
    return "https://demotiles.maplibre.org/style.json";
}

function makeConfig(
    apiKeys: MapConfigKeys = defaultMapConfigKeys()
): MapConfig {
    return {
        map: {
            zoom: 3,
            center: [0, 0],
            pitch: 45,
            bearing: 0,
        },
        style: defaultStyle(),
        projection: "globe",
        keys: apiKeys,
    };
}

export type InteractionModes =
    | "edit"
    | "select"
    | "move"
    | "draw-point"
    | "draw-line-string"
    | "draw-polygon"
    | "draw-circle"
    | "draw-rectangle";

export type ModeFeaturePair = {
    mode: InteractionModes;
    feature?: GeoJSON.Feature;
};
@customElement("ds-map")
export class MapboxMap extends BaseElement {
    static override styles = [styles];

    @property({ type: Object }) config: MapConfig = makeConfig();
    @property({ type: Array }) selectionSet: string[] = [];

    public mapboxGL?: MapboxGLMap;
    private _config = this.config;

    private _geoLayer?: GeoJsonSource;
    private _geoEditLayer?: GeoJsonSource;

    private _interactionMode?: InteractionMode;
    private _lastGlobePitch = 45;

    // we need to load the css before we can create the map
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
        if (this.mapboxGL) {
            this._geoLayer?.setSelectionSet(this.selectionSet);
            //this._geoEditLayer?.setSelectionSet(this.selectionSet);
            this._interactionMode?.onSelectionSetChanged(this.selectionSet);
        }
    }

    //---------------------------------------------------------------
    // Public functions
    //---------------------------------------------------------------

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

    public get projection(): "mercator" | "globe" {
        return this._config.projection;
    }

    public setProjection(projection: "mercator" | "globe") {
        const targetPitch = 0;

        if (
            this._config.projection === projection &&
            Math.abs(this._config.map.pitch - targetPitch) <= 1e-7
        ) {
            return;
        }

        this._config = {
            ...this._config,
            map: {
                ...this._config.map,
                pitch: targetPitch,
            },
            projection,
        };

        if (this.mapboxGL) {
            this.mapboxGL.easeTo({ pitch: targetPitch, duration: 250 });
        }

        this._applyProjectionAndTerrain();
    }

    public toggleProjection() {
        this.setProjection(
            this._config.projection === "globe" ? "mercator" : "globe"
        );
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

    public getCamera(): MapCameraState {
        if (this.mapboxGL) {
            const center = this.mapboxGL.getCenter();
            return {
                center: [center.lng, center.lat],
                zoom: this.mapboxGL.getZoom(),
                pitch: this.mapboxGL.getPitch(),
                bearing: this.mapboxGL.getBearing(),
            };
        }

        return {
            center: [this._config.map.center[0], this._config.map.center[1]],
            zoom: this._config.map.zoom,
            pitch: this._config.map.pitch,
            bearing: this._config.map.bearing,
        };
    }

    public setCamera(camera: MapCameraState) {
        const normalizedCamera: MapCameraState =
            this._config.projection === "globe"
                ? {
                      ...camera,
                      pitch: 0,
                  }
                : camera;

        const currentCamera = this.getCamera();
        if (cameraStateEqual(currentCamera, normalizedCamera)) {
            return;
        }

        this._config = {
            ...this._config,
            map: {
                ...this._config.map,
                center: [
                    normalizedCamera.center[0],
                    normalizedCamera.center[1],
                ],
                zoom: normalizedCamera.zoom,
                pitch: normalizedCamera.pitch,
                bearing: normalizedCamera.bearing,
            },
        };

        if (this.mapboxGL) {
            this.mapboxGL.jumpTo({
                center: normalizedCamera.center,
                zoom: normalizedCamera.zoom,
                pitch: normalizedCamera.pitch,
                bearing: normalizedCamera.bearing,
            });
        }
    }

    private _getEditModeForFeature(feature: GeoJSON.Feature) {
        if (checkIsCircle(feature)) {
            return "draw-circle";
        }
        if (checkIsRectangle(feature)) {
            return "draw-rectangle";
        }

        switch (feature.geometry.type) {
            case "Point":
                return "move";
                break;
            case "LineString":
                return "draw-line-string";
                break;
            case "Polygon":
                return "draw-polygon";
                break;
            case "MultiPoint":
                return "move";
                break;
            case "MultiLineString":
                return "draw-line-string";
                break;
            case "MultiPolygon":
                return "draw-polygon";
                break;
            default:
                throw new Error("Unsupported geometry type");
        }
    }

    //---------------------------------------------------------------
    // Interaction modes
    //---------------------------------------------------------------

    public editFeature(feature: GeoJSON.Feature) {
        if (!this._geoEditLayer || !this._geoLayer) {
            return;
        }
        this.setMode("edit", feature);
    }

    public setMode(mode: InteractionModes, feature?: Feature) {
        if (!this._geoEditLayer || !this._geoLayer) {
            return;
        }

        if (this._interactionMode) {
            this._interactionMode.onDeactivate();
        }
        this._interactionMode = this._createMode(mode, feature);

        if (this._geoLayer && this._geoEditLayer) {
            this._geoEditLayer.active = this._interactionMode.showEditLayer;
            this._geoLayer.active = this._interactionMode.showGeoLayer;
        }
        this._interactionMode.onActivate();
        this._interactionMode.onSelectionSetChanged(this.selectionSet);
    }

    private _createMode(
        mode: InteractionModes,
        feature?: Feature
    ): InteractionMode {
        if (!this._geoEditLayer || !this._geoLayer) {
            throw new Error("GeoJsonLayer is not initialized.");
        }
        if (mode === "edit") {
            if (this.selectionSet.length === 1 && feature === undefined) {
                feature = this._geoLayer.featureFromGuid(this.selectionSet[0]);
            }
            if (feature) {
                mode = this._getEditModeForFeature(feature) ?? "edit";
            }
        }

        switch (mode) {
            case "select":
                return new SelectMode(this, this._geoLayer, this._geoLayer);
            case "move":
                return new MoveSelectMode(
                    this,
                    this._geoEditLayer,
                    this._geoLayer
                );
            case "draw-point":
                return new CreatePointMode(this, this._geoLayer);
            case "draw-line-string":
                return new LineEditMode(this, this._geoEditLayer, feature);
            case "draw-circle":
                return new CircleEditMode(this, this._geoEditLayer, feature);
            case "draw-polygon":
                return new PolygonEditMode(this, this._geoEditLayer);
            case "draw-rectangle":
                return new RectangleEditMode(this, this._geoEditLayer, feature);
            case "edit":
                return new EditSelectMode(this, this._geoLayer);
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }
    }

    //---------------------------------------------------------------
    // Map Event Handlers
    //---------------------------------------------------------------

    public onKeyDown(event: KeyboardEvent) {
        if (this._interactionMode) {
            return this._interactionMode.onKeyDown(event);
        }
        return false;
    }

    public onKeyUp(event: KeyboardEvent) {
        if (this._interactionMode) {
            this._interactionMode.onKeyUp(event);
        }
    }

    private _onMouseMove(e: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onMouseMove(e);
        }
    }

    private _onMouseDown(e: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onMouseDown(e);
        }
    }

    private _onMouseUp(e: MapMouseEvent) {
        if (this._interactionMode) {
            this._interactionMode.onMouseUp(e);
        }
    }

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

    public setGeoJsonLayer(geo: GeoJSON.FeatureCollection) {
        this._geoLayer?.update(geo);
        this._geoLayer?.setSelectionSet(this.selectionSet);
    }

    //---------------------------------------------------------------
    // Initialization
    //---------------------------------------------------------------

    private async _loadImage(name: string) {
        const url = `/map-icons/${name}.png`;
        if (!this.mapboxGL) {
            return;
        }

        const image = await this.mapboxGL.loadImage(url);
        if (image?.data) {
            this.mapboxGL.addImage(name, image.data);
        }
    }

    private async _initMapbox(): Promise<void> {
        return new Promise((resolve, _reject) => {
            if (!this._mapContainer || !this._cssLoaded || !this._config) {
                return;
            }

            this.mapboxGL = new MapboxGLMap({
                container: this._mapContainer,
                style: this._config.style,
                center: [
                    this._config?.map.center[0],
                    this._config?.map.center[1],
                ],
                zoom: this._config.map.zoom,
                pitch: this._config.map.pitch,
            });

            const MAP_EVENTS = [
                { event: "mousemove", func: this._onMouseMove.bind(this) },
                { event: "mousedown", func: this._onMouseDown.bind(this) },
                { event: "mouseup", func: this._onMouseUp.bind(this) },
                { event: "mouseleave", func: this._onMouseLeave.bind(this) },
                { event: "click", func: this._onClick.bind(this) },
                { event: "keydown", func: this.onKeyDown.bind(this) },
            ];

            for (const { event, func } of MAP_EVENTS) {
                this.mapboxGL.on(event, (e: any) => {
                    if (this._interactionMode) {
                        func(e);
                    }
                });
            }

            this.mapboxGL.on("moveend", () => {
                this.dispatchEvent(
                    new CustomEvent("camera-changed", {
                        bubbles: true,
                        composed: true,
                        detail: this.getCamera(),
                    })
                );
            });

            this.mapboxGL.on("load", async () => {
                await this._applyProjectionAndTerrain();
                this._geoLayer = new GeoJsonSource(this, "map-data");
                this._geoEditLayer = new GeoJsonSource(this, "map-edit");
                resolve();
            });
        });
    }

    private async _applyProjectionAndTerrain() {
        if (!this.mapboxGL) {
            return;
        }

        try {
            const map = this.mapboxGL as any;
            const HILLSHADE_LAYER_ID = "terrain-hillshade";

            if (typeof map.setProjection === "function") {
                map.setProjection({ type: this._config.projection });
            }

            if (!map.getSource("terrain-dem")) {
                map.addSource("terrain-dem", {
                    type: "raster-dem",
                    tiles: [
                        "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
                    ],
                    tileSize: 256,
                    maxzoom: 15,
                    encoding: "terrarium",
                    attribution:
                        'DEM © <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen / OpenTopography / AWS Public Dataset</a>',
                });
            }

            if (typeof map.setTerrain === "function") {
                map.setTerrain({
                    source: "terrain-dem",
                    exaggeration: 1.8,
                });
            }

            if (!map.getLayer(HILLSHADE_LAYER_ID)) {
                map.addLayer({
                    id: HILLSHADE_LAYER_ID,
                    type: "hillshade",
                    source: "terrain-dem",
                    paint: {
                        "hillshade-exaggeration": 0.1,
                        "hillshade-shadow-color": "#27374a",
                        "hillshade-highlight-color": "#f4f1e8",
                        "hillshade-accent-color": "#8395ad",
                    },
                });
            }
        } catch (err) {
            // Keep map usable when globe/terrain is unsupported by runtime.
            console.warn("Unable to enable globe/terrain prototype", err);
        }
    }

    private async _initMap() {
        if (!this._mapContainer || !this._cssLoaded || !this._config) {
            return;
        }

        if (this.mapboxGL) {
            this.mapboxGL.remove();
            this.mapboxGL = undefined;
        }

        await this._initMapbox();

        const icons = ["point"];
        await Promise.all(icons.map((icon) => this._loadImage(icon)));

        this.setMode("select");

        this.dispatchEvent(
            new CustomEvent("map-loaded", { bubbles: true, composed: true })
        );

        //   this._disableRightMouseDragRotate();
    }

    //---------------------------------------------------------------
    // LitElement Overrides
    //---------------------------------------------------------------

    override firstUpdated() {
        if (this._mapContainer) {
            this._initMap();
        }
        requestAnimationFrame(() => this._animationFrameUpdate());
    }

    private _animationFrameUpdate() {
        if (this._interactionMode) {
            this._interactionMode.render();
        }
        requestAnimationFrame(() => this._animationFrameUpdate());
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
