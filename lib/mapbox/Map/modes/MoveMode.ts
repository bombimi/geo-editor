import { GeoDocument } from "geo/GeoDocument";
import { LngLat, Point } from "maplibre-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { FsmEditorMode } from "./FsmEditorMode";

export class MoveMode extends FsmEditorMode {
    public override displayName = "Move features mode";
    public override name = "move";
    public override description = "Move features on the map.";
    public override cursor = "crosshair";

    private _moving = false;
    private _clickedFeature = "";
    private _clickedFeatureWasInSelectionSet = false;
    private _moveStartPoint = new Point(0, 0);
    private _lastLngLat?: LngLat;
    //private _mouseMoveDebounced = debounce(this._mouseMove.bind(this), 1);
    protected _editDoc: GeoDocument = new GeoDocument();
    protected _editDelta = new LngLat(0, 0);

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        featureSource: GeoJsonSource
    ) {
        super(map, geoSource, featureSource);

        this._fsm = new StateMachine({
            initial: "waitForFeature",

            transitions: [
                "feature_selected : waitForFeature > moveFeature",
                "mouse_move : moveFeature > moveFeature",
                "mouse_up : moveFeature > featureClicked",
                "mouse_move : moveFeature > dragFeature",
                "mouse_move : dragFeature > dragFeature",
                "mouse_up : dragFeature > dragFeatureEnd",

                // completion
                "escapePressed : * > resetFeature",
                "enterPressed : * > createFeature",
                "featureCreated : createFeature > resetFeature",
            ],

            handlers: {},
        });
    }
}
