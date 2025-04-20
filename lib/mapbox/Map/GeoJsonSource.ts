import { uuidv4 } from "editor/Utils";
import { GeoJSONSource, Map as MapboxGLMap, MapMouseEvent } from "mapbox-gl";
import { MapboxMap } from "./MapboxMap";
import { getMapLayers } from "./MapLayers";

const LAYER_EVENTS = ["mousemove", "click", "mouseleave"];

export class GeoJsonSource {
    private _mapboxGL: MapboxGLMap;

    // The setFeatureState API requires a unique ID for each feature and that
    // appears to be a number. So we need to keep track of the mapping between
    // the GUID and the ID. The ID is used to set the feature state and the GUID
    // is used to identify the feature in the selection set.
    private _currentFeatureID = 0;
    private _idToGuid = new Map<number, string>();
    private _guidToId = new Map<string, number>();

    public active = false;

    constructor(
        map: MapboxMap,
        private _name: string,
        private _eventCallback: (
            sourceName: string,
            eventName: string,
            e: MapMouseEvent
        ) => void
    ) {
        this._mapboxGL = map.mapboxGL!;
        this._createSourceAndLayers();
    }

    public clear() {
        this.update({
            type: "FeatureCollection",
            features: [],
        });
    }

    public dispose() {
        const layers = getMapLayers(this._name);
        for (const layer of layers) {
            for (const event of LAYER_EVENTS) {
                this._mapboxGL.off(event, layer.id);
            }

            this._mapboxGL.removeLayer(layer.id);
        }
        this._mapboxGL.removeSource(this._name);
    }

    public setSelectionSet(selectionSet: string[]) {
        for (const [key, value] of this._guidToId.entries()) {
            const selected = selectionSet.includes(key);
            this._mapboxGL.setFeatureState(
                { source: this._name, id: value },
                { selected }
            );
        }
    }

    public featureIdFromGuid(guid: string): number | undefined {
        return this._guidToId.get(guid);
    }

    public featureGuidFromId(id: number): string | undefined {
        return this._idToGuid.get(id);
    }

    private _createSourceAndLayers() {
        this._mapboxGL.addSource(this._name, {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: [],
            },
        });

        const layers = getMapLayers(this._name);
        for (const layer of layers) {
            this._mapboxGL.addLayer(layer);

            for (const event of LAYER_EVENTS) {
                this._mapboxGL.on(event, layer.id, (e: MapMouseEvent) => {
                    if (this.active && this._eventCallback) {
                        this._eventCallback(this._name, event, e);
                    }
                });
            }
        }
    }

    public update(geo: GeoJSON.FeatureCollection) {
        if (!this._mapboxGL) {
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
        const source = this._mapboxGL.getSource(this._name) as GeoJSONSource;
        console.assert(source, `Source ${this._name} not found`);
        if (source) {
            source.setData(geo);
        }
    }
}
