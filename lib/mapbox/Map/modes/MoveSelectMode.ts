import { debounce } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { SelectMode } from "./SelectMode";

export class MoveSelectMode extends SelectMode {
    public override displayName = "Move features";
    public override name = "move";
    public override description = "Move features on the map.";
    public override cursor = "cursor";

    private _moving = false;
    private _lastLngLat?: LngLat;
    private _mouseMoveDebounced = debounce(this._mouseMove.bind(this), 100);
    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
    }

    public override onMouseDown(e: MapMouseEvent): void {
        const features = this._geoSource.featuresAtScreenLocation(e.point);
        if (this._map && features && features.length) {
            console.log("onMouseDown: moving");

            this._map.mapboxGL!.dragPan.disable();
            this._moving = true;
            this._lastLngLat = e.lngLat;
        }
    }

    public override onMouseUp(_event: MapMouseEvent): void {
        if (this._moving) {
            this._moving = false;
            this._map.mapboxGL!.dragPan.enable();
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        this._mouseMoveDebounced(e);
        //        this._mouseMove(e);
    }

    private _mouseMove(e: MapMouseEvent): void {
        if (this._moving) {
            console.log("onMouseMove: moving");

            if (this._selectionSet.length > 0 && this._lastLngLat) {
                const deltaLat = e.lngLat.lat - this._lastLngLat!.lat;
                const deltaLon = e.lngLat.lng - this._lastLngLat!.lng;
                console.log("move");
                this._map._dispatchEvent("move-feature", {
                    selectionSet: this._selectionSet,
                    lon: deltaLon,
                    lat: deltaLat,
                });
                this._lastLngLat = e.lngLat;
            }

            e.preventDefault();
        } else {
            super.onMouseMove(e);
        }
    }
}
