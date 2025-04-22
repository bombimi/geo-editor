import { Feature } from "geojson";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { InteractionMode } from "../InteractionMode";
import { MapboxMap } from "../MapboxMap";
import { getFeatureAtScreenLocation } from "./Helpers";

export abstract class EditorBaseMode extends InteractionMode {
    protected _dirty = true;

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
    }

    protected _markDirty() {
        this._dirty = true;
    }

    protected _reset() {
        this._geoSource.clear();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._reset();
    }

    //-------------------------------------------------------------------------
    // API
    //-------------------------------------------------------------------------

    protected _onVertexSelected(_vertex: Feature) {}
    protected _onMidpointSelected(_midpoint: Feature) {}
    protected _onMapSelected(_point: LngLat) {}
    protected _onEscapePressed() {}
    protected _onEnterPressed() {}
    protected _onMouseUp(_e: MapMouseEvent) {}
    protected _onMouseMove(_e: MapMouseEvent) {}

    //-------------------------------------------------------------------------
    // InteractionMode methods
    //-------------------------------------------------------------------------
    public override onMouseMove(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        const feature = getFeatureAtScreenLocation(this._geoSource, e.point);
        if (feature) {
            this._setCursor("pointer");
        } else {
            this._setCursor();
        }
        this._onMouseMove(e);
    }

    public override onMouseDown(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        const feature = getFeatureAtScreenLocation(this._geoSource, e.point);
        if (feature) {
            switch (feature.properties!.__line_editor_type) {
                case "VERTEX":
                    this._onMidpointSelected(feature);
                    break;
                case "MIDPOINT":
                    this._onVertexSelected(feature);
                    break;
            }
        } else {
            this._onMapSelected(e.lngLat);
        }

        e.preventDefault();
    }

    public override onMouseUp(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        this._onMouseUp(e);
    }

    public override onKeyDown(e: KeyboardEvent): boolean {
        console.assert(this.isActive, "LineEditorMode is not active");
        if (e.key === "Escape") {
            this._onEscapePressed();
        } else if (e.key === "Enter") {
            this._onEnterPressed();
            return true;
        }
        return false;
    }
}
