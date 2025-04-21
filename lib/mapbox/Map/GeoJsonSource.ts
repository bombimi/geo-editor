import { uuidv4 } from "editor/Utils";
import { Feature } from "geojson";
import { cloneDeep, uniqBy } from "lodash-es";
import {
    GeoJSONSource,
    Map as MapboxGLMap,
    MapMouseEvent,
    Point,
} from "mapbox-gl";
import { MapboxMap } from "./MapboxMap";
import { getMapLayers } from "./MapLayers";

export class GeoJsonSource {
    private _mapboxGL: MapboxGLMap;

    // The setFeatureState API requires a unique ID for each feature and that
    // appears to be a number. So we need to keep track of the mapping between
    // the GUID and the ID. The ID is used to set the feature state and the GUID
    // is used to identify the feature in the selection set.
    private _currentFeatureID = 1;
    private _idToGuid = new Map<number, string>();
    private _guidToId = new Map<string, number>();
    private _guidToFeature = new Map<string, Feature>();

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

        for (const feature of newGeo.features) {
            feature.id = this._currentFeatureID++;
            const guid = feature.properties?.__meta_guid || uuidv4();
            this._idToGuid.set(feature.id, guid);
            this._guidToId.set(guid, feature.id);
            this._guidToFeature.set(guid, feature);
        }

        // const features = geo.features;
        // // add feature to id mapping for new objects
        // for (const feature of features) {
        //     const guid = feature.properties?.__meta_guid;
        //     console.assert(guid !== undefined, "Feature does not have a guid");
        //     if (!this._guidToId.has(feature.properties?.__meta_guid)) {
        //         const guid = feature.properties?.__meta_guid || uuidv4();
        //         feature.id = this._currentFeatureID++
        //         this._idToGuid.set(feature.id, guid);
        //         this._guidToId.set(guid, feature.id);
        //     } else {
        //         feature.id = this._guidToId.get(guid)!;
        //     }
        //     this._guidToFeature.set(guid, feature);
        // }

        // just update the existing layer and avoid the full redraw if we are initialized
        const source = this._mapboxGL.getSource(this._name) as GeoJSONSource;
        console.assert(source, `Source ${this._name} not found`);
        if (source) {
            source.setData(newGeo);
        }
    }
}
