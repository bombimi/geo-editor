import { featureCollection } from "@turf/helpers";
import { Feature } from "geojson";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { FsmEditorMode } from "./FsmEditorMode";

export class CircleEditMode extends FsmEditorMode {
    public override displayName = "Circle Editor mode";
    public override name = "circle-editor";
    public override description = "Edit circles on the map.";
    public override cursor = "crosshair";
    public override useEditLayer = true;

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        protected _existingFeature?: Feature
    ) {
        super(map, geoSource);

        if (_existingFeature) {
            if (_existingFeature.geometry.type !== "Polygon") {
                throw new Error("Existing feature is not a Polygon");
            }

            if (_existingFeature.geometry.coordinates) {
            }
        }

        this._fsm = new StateMachine({
            transitions: [],
            handlers: {
                resetFeature: () => {
                    console.log("CircleEditMode: resetFeature");

                    this._reset();
                },

                createFeature: (_e: string, fsm: StateMachine) => {
                    console.log("CircleEditMode: createFeature");

                    if (this._existingFeature) {
                        this._map._dispatchEvent("update-feature");
                    } else {
                        this._map._dispatchEvent("create-feature");
                    }
                    fsm.do("escapePressed");
                },
            },
        });
    }

    protected override _reset() {
        super._reset();
        this._fsm?.go("addPoint");
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._existingFeature = undefined;
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        const features: Feature[] = [];
        const collection = featureCollection(features);
        this._geoSource.update(collection);
        this._dirty = false;
    }
}
