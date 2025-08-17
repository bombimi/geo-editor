import { Feature } from "geojson";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { EditorBaseMode } from "./EditorBaseMode";

export abstract class FsmEditorMode extends EditorBaseMode {
    protected _fsm?: StateMachine;

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource, geoSource);
    }

    protected override _onVertexSelected(_vertex: Feature): void {
        this._fsm?.do("vertex_selected", _vertex);
    }

    protected override _onMidpointSelected(_midpoint: Feature): void {
        this._fsm?.do("midpoint_selected", _midpoint);
    }

    protected override _onMapSelected(lngLat: LngLat): void {
        this._fsm?.do("map_selected", lngLat);
    }

    protected override _onEscapePressed(): void {
        this._fsm?.do("escapePressed");
    }

    protected override _onEnterPressed(): void {
        this._fsm?.do("enterPressed");
    }

    protected override _onMouseUp(e: MapMouseEvent): void {
        this._fsm?.do("mouseup", e);
    }

    protected override _onMouseMove(e: MapMouseEvent, feature?: Feature): void {
        this._fsm?.do("mouse_move", e, feature);
    }
}
