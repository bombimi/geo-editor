import { uuidv4 } from "editor/Utils";
import { Feature } from "geojson";
import { cloneDeep, uniqBy } from "lodash-es";
import { GeoJSONSource, Map as MapboxGLMap, Point } from "mapbox-gl";
import { MapboxMap } from "./MapboxMap";
import { getMapLayers } from "./MapLayers";

export class GeoJsonSource {
    private _mapboxGL: MapboxGLMap;
    private _idToGuid = new Map<number, string>();
    private _guidToId = new Map<string, number>();
    private _guidToFeature = new Map<string, Feature>();
    private _source: GeoJSONSource;

    public active = false;

    constructor(
        map: MapboxMap,
        private _name: string
    ) {
        this._mapboxGL = map.mapboxGL!;
        this._createSourceAndLayers();
        this._source = this._mapboxGL.getSource(this._name) as GeoJSONSource;
        console.assert(this._source, `Source ${this._name} not found`);
    }

    public clear() {
        const source = this._mapboxGL.getSource(this._name) as GeoJSONSource;
        source.setData({
            type: "FeatureCollection",
            features: [],
        });
    }

    public dispose() {
        const layers = getMapLayers(this._name);
        for (const layer of layers) {
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

    public featureFromGuid(guid: string): Feature | undefined {
        return this._guidToFeature.get(guid);
    }

    public featuresAtScreenLocation(point: Point): Feature[] {
        const layers = getMapLayers(this._name).map((layer) => layer.id);
        const features = this._mapboxGL.queryRenderedFeatures(point, {
            layers,
        });
        return uniqBy(features, (f) => f.properties!.__meta_guid);
    }

    public setFeatureState(id: number | string, state: any) {
        this._mapboxGL.setFeatureState({ source: this._name, id }, state);
    }

    public setSelectionState(id: number | string, selected: boolean) {
        this.setFeatureState(id, { selected });
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
        }
    }

    public update(geo: GeoJSON.FeatureCollection) {
        if (!this._mapboxGL) {
            return;
        }

        const newGeo = cloneDeep(geo);

        this._guidToFeature.clear();
        this._guidToId.clear();
        this._idToGuid.clear();

        // The setFeatureState API requires a unique ID for each feature and that
        // appears to be a number. So we need to keep track of the mapping between
        // the GUID and the ID. The ID is used to set the feature state and the GUID
        // is used to identify the feature in the selection set.
        let currentFeatureID = 1;

        for (const feature of newGeo.features) {
            const guid = feature.properties?.__meta_guid || uuidv4();
            feature.properties = feature.properties || {};

            feature.id = currentFeatureID++;

            this._idToGuid.set(feature.id, guid);
            this._guidToId.set(guid, feature.id);
            this._guidToFeature.set(guid, feature);
        }

        // just update the existing layer and avoid the full redraw if we are initialized
        if (this._source) {
            this._source.setData(newGeo);
        }
    }
}
