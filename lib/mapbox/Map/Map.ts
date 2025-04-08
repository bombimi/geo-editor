import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./Map.style";

import { Map as MapboxMap } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { merge } from "lodash-es";
import { watch } from "../../ui-utils/watch";
import { Location } from "../../geo/GeoJson";

export type MapConfig = ReturnType<typeof makeConfig>;

export type MapConfigKeys = {
    freetilehosting: string;
    mapbox: string;
};

export function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultMapConfigKeys(): MapConfigKeys {
    return {
        freetilehosting: "RCnhHPcnEt4bamnExBR1",
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
export class Map extends LitElement {
    static override styles = [styles];

    @property({ type: Object }) config: MapConfig = makeConfig();

    private _map?: MapboxMap;
    private _config = this.config;
    private _activeLayers: any[] = [];
    private _geoJsonLayers: any[] = [];
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

    public addGeoJsonLayer(geo: GeoJSON.FeatureCollection) {
        //this._geoJsonLayers.push(geo);
        this._map?.addSource("geojson", {
            type: "geojson",
            data: geo,
        });
        this._map?.addLayer({
            id: "geojson-layer",
            source: "geojson",
            type: "line",
            paint: {
                "line-color": "#000",
                "line-width": 3,
            },
        });

        this._map?.addLayer({
            id: "points",
            type: "symbol",
            source: "geojson",
            layout: {
                "icon-image": "point",
                "icon-size": 0.15,
            },
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

            this._map = new MapboxMap({
                container: this._mapContainer,
                style: this._config.style,
                projection: this._config.projection,
                center: [this._config?.map.center[0], this._config?.map.center[1]],
                zoom: this._config.map.zoom,
                pitch: this._config.map.pitch,
            });
            this._map.on("load", () => {
                this._addCheckedLayers();
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

    private async _addCheckedLayers() {
        if (!this._map) {
            return;
        }

        for (const layer of this._activeLayers) {
            this._addLayer(layer);
            while (!this._map.loaded()) {
                await timeout(50);
            }
        }
    }
    private _addLayer(layer: any) {
        if (!this._map) {
            return;
        }

        switch (layer.type) {
            case "fill":
            case "point":
            case "line":
            case "circle":
            case "raster":
            case "hillshade":
                this._map.addLayer(layer);
                break;
        }
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
