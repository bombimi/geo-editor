import { Feature } from "geojson";
import { LngLat, MapMouseEvent } from "maplibre-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { InteractionMode } from "../InteractionMode";
import { MapboxMap } from "../MapboxMap";
import { getFeatureAtScreenLocation } from "./Helpers";

export abstract class EditorBaseMode extends InteractionMode {
    protected _dirty = true;
    protected _hoveredFeatureId?: any;

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
    protected _onFeatureSelected(_feature: Feature) {}
    protected _onMapSelected(_point: LngLat) {}
    protected _onEscapePressed() {}
    protected _onEnterPressed() {}
    protected _onMouseUp(_e: MapMouseEvent) {}
    protected _onMouseMove(_e: MapMouseEvent, _feature?: Feature) {}
    protected _onMouseLeave(_e: MapMouseEvent) {}

    //-------------------------------------------------------------------------
    // InteractionMode methods
    //-------------------------------------------------------------------------
    public override onMouseMove(e: MapMouseEvent): void {
        console.assert(this.isActive, `${this.name} is not active`);

        if (this._hoveredFeatureId) {
            this._geoSource.setSelectionState(this._hoveredFeatureId, false);
            this._hoveredFeatureId = undefined;
            this._setCursor();
        }

        const feature = getFeatureAtScreenLocation(this._geoSource, e.point);
        if (feature) {
            this._hoveredFeatureId = feature.id;
            this._geoSource.setSelectionState(
                this._hoveredFeatureId as number,
                true
            );

            this._setCursor("pointer");
        } else {
            this._setCursor();
        }
        this._onMouseMove(e, feature);
    }

    public override onMouseLeave(e: MapMouseEvent): void {
        this._onMouseLeave(e);
    }

    public override onMouseDown(e: MapMouseEvent): void {
        console.assert(this.isActive, `${this.name} is not active`);
        const feature = getFeatureAtScreenLocation(this._geoSource, e.point);
        if (feature) {
            let handled = false;
            switch (feature.properties!.__line_editor_type) {
                case "VERTEX":
                    this._onVertexSelected(feature);
                    handled = true;
                    break;
                case "MIDPOINT":
                    this._onMidpointSelected(feature);
                    handled = true;
                    break;
            }
            if (handled) {
                this._onFeatureSelected(feature);
            }
        } else {
            this._onMapSelected(e.lngLat);
        }

        e.preventDefault();
    }

    public override onMouseUp(e: MapMouseEvent): void {
        console.assert(this.isActive, `${this.name} is not active`);

        this._onMouseUp(e);
    }

    public override onKeyDown(e: KeyboardEvent): boolean {
        console.assert(this.isActive, `${this.name} is not active`);

        if (e.key === "Escape") {
            this._onEscapePressed();
        } else if (e.key === "Enter") {
            this._onEnterPressed();
            return true;
        }
        return false;
    }
}
