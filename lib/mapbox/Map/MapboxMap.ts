import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./MapboxMap.style";

import { merge } from "lodash-es";
import mapboxgl, { Map as MapboxGLMap, MapMouseEvent } from "mapbox-gl";

import { Location } from "../../geo/GeoJson";
import { BaseElement } from "../../ui-lib/BaseElement";
import { watch } from "../../ui-utils/watch";
import { GeoJsonSource } from "./GeoJsonSource";
import { InteractionMode } from "./InteractionMode";
import { CreatePointMode } from "./modes/CreatePointMode";
import { EditMode } from "./modes/EditMode";
import { LineEditorMode } from "./modes/LineEditorMode";
import { SelectMode } from "./modes/SelectMode";

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
    | "edit"
    | "select"
    | "move-feature"
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

    private _geoLayer?: GeoJsonSource;
    private _geoEditLayer?: GeoJsonSource;
    private _currentLayer?: GeoJsonSource;

    private _interactionMode?: InteractionMode;
    private _currentEditFeature?: GeoJSON.Feature;

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
            this._currentLayer?.setSelectionSet(this.selectionSet);
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

    public editFeature(feature: GeoJSON.Feature) {
        this._currentEditFeature = feature;
        switch (feature.geometry.type) {
            case "Point":
                this.mode = "move-feature";
                break;
            case "LineString":
                this.mode = "draw-line-string";
                break;
            case "Polygon":
                this.mode = "draw-polygon";
                break;
            case "MultiPoint":
                this.mode = "move-feature";
                break;
            case "MultiLineString":
                this.mode = "draw-line-string";
                break;
            case "MultiPolygon":
                this.mode = "draw-polygon";
                break;
            default:
                throw new Error("Unsupported geometry type");
        }
    }

    //---------------------------------------------------------------
    // Interaction modes
    //---------------------------------------------------------------

    @watch("mode")
    _onModeChange() {
        if (!this._geoEditLayer || !this._geoLayer) {
            return;
        }

        if (this._interactionMode) {
            this._interactionMode.onDeactivate();
        }
        this._interactionMode = this._createMode(this.mode);

        if (this._geoLayer && this._geoEditLayer) {
            if (this._interactionMode.useEditLayer) {
                this._geoEditLayer.active = true;
                this._geoLayer.active = false;
                this._currentLayer = this._geoEditLayer;
            } else {
                this._geoLayer.active = true;
                this._geoEditLayer.active = false;
                this._currentLayer = this._geoLayer;
            }
        }
        this._interactionMode.onActivate();
    }

    private _createMode(mode: InteractionModes): InteractionMode {
        if (!this._geoEditLayer || !this._geoLayer) {
            throw new Error("GeoJsonLayer is not initialized.");
        }
        switch (mode) {
            case "select":
                return new SelectMode(this, this._geoLayer);
            case "draw-point":
                return new CreatePointMode(this, this._geoLayer);
            case "draw-line-string":
                return new LineEditorMode(
                    this,
                    this._geoEditLayer,
                    this._currentEditFeature
                );
            case "draw-polygon":
                return new SelectMode(this, this._geoLayer);
            case "draw-circle":
                return new SelectMode(this, this._geoLayer);
            case "draw-rectangle":
                return new SelectMode(this, this._geoLayer);
            case "edit":
                return new EditMode(this, this._geoLayer);
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

    private _geoJsonSourceEvent(
        _sourceName: string,
        eventName: string,
        e: MapMouseEvent
    ) {
        if (this._interactionMode) {
            switch (eventName) {
                case "mousemove":
                    this._onMouseMove(e);
                    break;
                case "mouseleave":
                    this._onMouseLeave(e);
                    break;
                case "click":
                    this._onClick(e);
                    break;
                default:
                    break;
            }
        }
    }

    //---------------------------------------------------------------
    // Initialization
    //---------------------------------------------------------------

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

            this.mapboxGL.on("load", () => {
                this._geoEditLayer = new GeoJsonSource(
                    this,
                    "map-edit",
                    this._geoJsonSourceEvent.bind(this)
                );
                this._geoLayer = new GeoJsonSource(
                    this,
                    "map-data",
                    this._geoJsonSourceEvent.bind(this)
                );

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
        if (this.mapboxGL) {
            this.mapboxGL.remove();
            this.mapboxGL = undefined;
        }

        await this._initMapbox();

        const icons = ["point"];
        await Promise.all(icons.map((icon) => this._loadImage(icon)));

        this._onModeChange();

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
