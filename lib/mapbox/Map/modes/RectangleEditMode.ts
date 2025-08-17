import { featureCollection } from "@turf/helpers";
import {
    checkIsRectangle,
    rectangleFromTwoPoints,
    RectangleObject,
} from "geo/objects/RectangleObject";
import { Feature } from "geojson";
import { cloneDeep } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { VertexStyle } from "./EditStyles";
import { FsmEditorMode } from "./FsmEditorMode";
import { makePoint } from "./Helpers";

export class RectangleEditMode extends FsmEditorMode {
    public override displayName = "Rectangle Editor mode";
    public override name = "rectangle-editor";
    public override description = "Edit rectangles on the map.";
    public override cursor = "crosshair";
    public override showEditLayer = true;

    private _rect?: RectangleObject;
    private _firstPoint?: number[];

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        protected _existingFeature?: Feature
    ) {
        super(map, geoSource);

        if (_existingFeature) {
            if (!checkIsRectangle(_existingFeature)) {
                throw new Error("Existing feature is not a Rectangle");
            }
            this._rect = new RectangleObject(_existingFeature);
        }

        this._fsm = new StateMachine({
            initial: this._existingFeature ? "selectElement" : "getFirstPoint",

            transitions: [
                // get points
                "mouse_move : getSecondPoint > getSecondPoint",
                "map_selected : getFirstPoint > getSecondPoint",
                "vertex_selected : getSecondPoint > selectElement",
                "map_selected : getSecondPoint > selectElement",

                // dragging the first point
                "midpoint_selected : selectElement > dragFirstPoint",
                "mouse_move : dragFirstPoint > dragFirstPoint",
                "mouseup : dragFirstPoint > selectElement",

                // dragging the second point
                "vertex_selected : selectElement > dragSecondPoint",
                "mouse_move : dragSecondPoint > dragSecondPoint",
                "mouseup : dragSecondPoint > selectElement",

                // completion
                "escapePressed : * > resetFeature",
                "enterPressed : * > createFeature",
                "featureCreated : createFeature > resetFeature",
            ],

            handlers: {
                "dragSecondPoint@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log(
                        "RectangleEditMode: dragSecondPoint@mouse_move"
                    );
                    console.assert(this._rect);

                    if (this._rect) {
                        this._rect = rectangleFromTwoPoints(
                            this._rect.northWest,
                            e.lngLat.toArray(),
                            this._existingFeature?.properties?.__meta_guid
                        );
                        this._markDirty();
                    }
                },
                "getSecondPoint@map_selected": () => {
                    console.log(
                        "RectangleEditMode: getSecondPoint@map_selected"
                    );
                },
                "getFirstPoint@map_selected": (
                    _event: string,
                    _fsm: StateMachine,
                    lngLat: LngLat
                ) => {
                    console.log(
                        "RectangleEditMode: getFirstPoint@map_selected"
                    );
                    this._firstPoint = lngLat.toArray();
                    this._setCursor("crosshair");
                    this._markDirty();
                },
                "getSecondPoint@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log("RectangleEditMode: getSecondPoint@mouse_move");
                    console.assert(this._firstPoint);
                    if (this._firstPoint) {
                        this._rect = rectangleFromTwoPoints(
                            this._firstPoint,
                            e.lngLat.toArray(),
                            this._existingFeature?.properties?.__meta_guid
                        );

                        this._setCursor("crosshair");
                        this._markDirty();
                    }
                },
                "dragFirstPoint@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log("RectangleEditMode: dragFirstPoint@mouse_move");
                    if (this._rect) {
                        this._rect.northWest = e.lngLat.toArray();
                        this._setCursor("crosshair");
                        this._markDirty();
                    }
                },

                resetFeature: () => {
                    console.log("RectangleEditMode: resetFeature");
                    this._reset();
                },

                createFeature: (_e: string, fsm: StateMachine) => {
                    console.log("RectangleEditMode: createFeature");

                    if (this._existingFeature) {
                        this._map._dispatchEvent(
                            "update-feature",
                            this._rect?.feature
                        );
                    } else {
                        const newFeature = cloneDeep(this._rect?.feature);
                        delete newFeature?.properties?.__meta_guid;
                        this._map._dispatchEvent("create-feature", newFeature);
                    }
                    fsm.do("escapePressed");
                },
            },
        });
    }

    protected override _reset() {
        super._reset();
        this._existingFeature = undefined;
        this._fsm?.reset("getFirstPoint");
    }

    public override onActivate(): void {
        super.onActivate();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._existingFeature = undefined;
        this._rect = undefined;
        this._firstPoint = undefined;
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        const features: Feature[] = [];
        if (this._rect) {
            features.push(this._rect.feature);
            features.push(
                makePoint(this._rect.northWest, VertexStyle, "MIDPOINT", 0)
            );
            features.push(
                makePoint(this._rect.southEast, VertexStyle, "VERTEX", 0)
            );
        }
        const collection = featureCollection(features);
        this._geoSource.update(collection);
        this._dirty = false;
    }
}
