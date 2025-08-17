import { featureCollection } from "@turf/helpers";
import { GeoDocument } from "geo/GeoDocument";
import { GeoObject } from "geo/GeoObject";
import { Factory } from "geo/objects/Factory";
import { debounce } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { createCustomEvent } from "ui-lib/Utils";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { SelectMode } from "./SelectMode";

export class MoveSelectMode extends SelectMode {
    public override displayName = "Move features";
    public override name = "move";
    public override description = "Move features on the map.";
    public override cursor = "cursor";
    public override showEditLayer = true;
    public override showGeoLayer = true;

    protected _dirty = true;
    private _moving = false;
    private _lastLngLat?: LngLat;
    private _mouseMoveDebounced = debounce(this._mouseMove.bind(this), 1);
    protected _editDoc: GeoDocument = new GeoDocument();
    protected _editDelta = new LngLat(0, 0);

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        featureSource: GeoJsonSource
    ) {
        super(map, geoSource, featureSource);
    }

    protected _markDirty() {
        this._dirty = true;
    }

    protected _reset() {
        this._geoSource.clear();
        this._editDelta = new LngLat(0, 0);
        this._editDoc = new GeoDocument();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._reset();
    }

    public override onSelectionSetChanged(selectionSet: string[]): void {
        super.onSelectionSetChanged(selectionSet);
        const toRemove = new Set<string>();
        this._editDoc.children.forEach((x) => toRemove.add(x.guid));

        const features = selectionSet
            .map((x) => this._featureSource.featureFromGuid(x))
            .filter((x) => x !== undefined);
        features.forEach((x) => {
            const guid = (x.properties as any).__meta_guid;
            if (!this._editDoc.getChild(guid)) {
                // add the feature
                this._editDoc.addChild(Factory.createFeature(x, guid));
            } else {
                // ignore existing
                toRemove.delete(guid);
            }
        });

        // remove unselected objects
        for (const item of toRemove) {
            this._editDoc.removeChild(item);
        }
        this._markDirty();
    }

    public override onMouseDown(e: MapMouseEvent): void {
        const features = this._featureSource.featuresAtScreenLocation(e.point);
        if (this._map && features && features.length) {
            console.log("onMouseDown: moving");

            const guid: string = (features[0].properties as any).__meta_guid;

            if (!e.originalEvent.ctrlKey) {
                // ignore if we have clicked on an already selected feature
                if (!this._selectionSet.includes(guid)) {
                    this._selectionSet = [guid];
                    this._map.dispatchEvent(
                        createCustomEvent(
                            "set-selection-set",
                            this._selectionSet
                        )
                    );
                }
            } else {
                this._map.dispatchEvent(
                    createCustomEvent("set-selection-set", [
                        ...this._selectionSet,
                        guid,
                    ])
                );
            }

            this._map.mapboxGL!.dragPan.disable();
            this._map.mapboxGL!.dragRotate.disable();

            this._moving = true;
            this._lastLngLat = e.lngLat;
        }
    }

    public override onMouseUp(_event: MapMouseEvent): void {
        if (this._moving) {
            // commit to the move
            if (this._editDelta.lng !== 0 || this._editDelta.lat !== 0) {
                this._map._dispatchEvent("move-feature", {
                    selectionSet: this._selectionSet,
                    lon: this._editDelta.lng,
                    lat: this._editDelta.lat,
                });
            }
            this._editDelta = new LngLat(0, 0);
            this._moving = false;
            this._map.mapboxGL!.dragPan.enable();
            this._map.mapboxGL!.dragRotate.enable();
            this._markDirty();
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        super.onMouseMove(e);
        this._mouseMoveDebounced(e);
    }

    private _mouseMove(e: MapMouseEvent): void {
        if (this._moving) {
            console.log("onMouseMove: moving");

            if (this._selectionSet.length > 0 && this._lastLngLat) {
                const deltaLat = e.lngLat.lat - this._lastLngLat!.lat;
                const deltaLon = e.lngLat.lng - this._lastLngLat!.lng;
                console.log("move");

                this._editDoc.children
                    .map((x) => x as GeoObject)
                    .forEach((x) => x.move(deltaLat, deltaLon));

                this._markDirty();
                this._editDelta.lng += deltaLon;
                this._editDelta.lat += deltaLat;
                this._lastLngLat = e.lngLat;
            }

            e.preventDefault();
        } else {
            super.onMouseMove(e);
        }
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        if (!this._moving) {
            this._geoSource.clear();
        } else {
            const collection = featureCollection(
                this._editDoc.geoJson?.features.features
            );
            this._geoSource.update(collection);
        }

        this._dirty = false;
    }
}
