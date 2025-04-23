import { featureCollection } from "@turf/helpers";
import { DocumentProperty } from "editor/DocumentProperty";
import {
    checkIsCircle,
    circleFromTwoPoints,
    CircleObject,
} from "geo/objects/CircleObject";
import { Feature } from "geojson";
import { cloneDeep } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { VertexStyle } from "./EditStyles";
import { FsmEditorMode } from "./FsmEditorMode";
import { makePoint } from "./Helpers";

export class CircleEditMode extends FsmEditorMode {
    public override displayName = "Circle Editor mode";
    public override name = "circle-editor";
    public override description = "Edit circles on the map.";
    public override cursor = "crosshair";
    public override useEditLayer = true;

    private _circle?: CircleObject;
    private _potentialCenterPos?: number[];

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        protected _existingFeature?: Feature
    ) {
        super(map, geoSource);

        if (_existingFeature) {
            if (!checkIsCircle(_existingFeature)) {
                throw new Error("Existing feature is not a Circle");
            }
            this._circle = new CircleObject(_existingFeature);
        }

        this._fsm = new StateMachine({
            initial: this._existingFeature ? "selectElement" : "getCenter",

            transitions: [
                // get initial point and radius
                "mouse_move : getRadius > getRadius",
                "map_selected : getCenter > getRadius",
                "vertex_selected : getRadius > selectElement",
                "map_selected : getRadius > selectElement",

                // dragging the center
                "midpoint_selected : selectElement > dragCenter",
                "mouse_move : dragCenter > dragCenter",
                "mouseup : dragCenter > selectElement",

                // dragging the radius
                "vertex_selected : selectElement > dragRadius",
                "mouse_move : dragRadius > dragRadius",
                "mouseup : dragRadius > selectElement",

                // completion
                "escapePressed : * > resetFeature",
                "enterPressed : * > createFeature",
                "featureCreated : createFeature > resetFeature",
            ],

            handlers: {
                "dragRadius@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log("CircleEditMode: dragRadius@mouse_move");
                    console.assert(this._circle);

                    if (this._circle) {
                        this._circle = circleFromTwoPoints(
                            this._circle.center,
                            e.lngLat.toArray(),
                            this._existingFeature?.properties?.__meta_guid
                        );
                        this._markDirty();
                    }
                },
                "getRadius@map_selected": () => {
                    console.log("CircleEditMode: getRadius@map_selected");
                },
                "getCenter@map_selected": (
                    _event: string,
                    _fsm: StateMachine,
                    lngLat: LngLat
                ) => {
                    console.log("CircleEditMode: getCenter@map_selected");
                    this._potentialCenterPos = lngLat.toArray();
                    this._setCursor("crosshair");
                    this._markDirty();
                },
                "getRadius@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log("CircleEditMode: getRadius@mouse_move");
                    console.assert(this._potentialCenterPos);
                    if (this._potentialCenterPos) {
                        this._circle = circleFromTwoPoints(
                            this._potentialCenterPos,
                            e.lngLat.toArray(),
                            this._existingFeature?.properties?.__meta_guid
                        );

                        this._setCursor("crosshair");
                        this._markDirty();
                    }
                },
                "dragCenter@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    console.log("CircleEditMode: dragCenter@mouse_move");
                    if (this._circle) {
                        this._circle.center = e.lngLat.toArray();
                        this._setCursor("crosshair");
                        this._markDirty();
                    }
                },

                resetFeature: () => {
                    console.log("CircleEditMode: resetFeature");
                    this._reset();
                },

                createFeature: (_e: string, fsm: StateMachine) => {
                    console.log("CircleEditMode: createFeature");

                    if (this._existingFeature) {
                        this._map._dispatchEvent(
                            "update-feature",
                            this._circle?.feature
                        );
                    } else {
                        const newFeature = cloneDeep(this._circle?.feature);
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
        this._fsm?.go("getCenter");
    }
    public override onActivate(): void {
        super.onActivate();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._existingFeature = undefined;
        this._circle = undefined;
        this._potentialCenterPos = undefined;
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        const features: Feature[] = [];
        if (this._circle) {
            this._circle.updateProperty(
                new DocumentProperty("__line_editor_type", "VERTEX")
            );

            features.push(this._circle.feature);
            features.push(
                makePoint(this._circle.center, VertexStyle, "MIDPOINT", 0)
            );
        }
        const collection = featureCollection(features);
        this._geoSource.update(collection);
        this._dirty = false;
    }
}
