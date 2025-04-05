import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { styles } from "./Map.style";

import { Map as MapboxMap } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import { merge } from "lodash-es";
import { watch } from "../../ui-utils/watch";

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
            zoom: 1,
            center: [0, 0],
            pitch: 0,
            bearing: 0,
        },
        style: "mapbox://styles/mapbox/satellite-v9",
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

    private _initMap() {
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
            //   this._disableRightMouseDragRotate();
        });
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
