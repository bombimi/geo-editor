import { featureCollection, lineString } from "@turf/helpers";
import { Feature, GeoJsonProperties, LineString, Position } from "geojson";
import { cloneDeep } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import {
    DefaultLineStyle,
    EditLineStyle,
    MidpointStyle,
    VertexStyle,
} from "./EditStyles";
import { FsmEditorMode } from "./FsmEditorMode";
import { makePoint } from "./Helpers";

export class LineEditMode extends FsmEditorMode {
    public override displayName = "Line Editor mode";
    public override name = "line-editor";
    public override description = "Edit lines on the map.";
    public override cursor = "crosshair";
    public override useEditLayer = true;

    private _mouseLngLat: LngLat | undefined;
    private _selectedVertexPosition: LngLat | undefined;
    private _currentFeatureIndex: number | undefined;

    private _lineFeature = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [] as Position[],
        },
        properties: Object.assign({}, EditLineStyle) as GeoJsonProperties,
    } as Feature<LineString, GeoJsonProperties>;

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        protected _existingFeature?: Feature
    ) {
        super(map, geoSource);

        if (_existingFeature) {
            if (_existingFeature.geometry.type !== "LineString") {
                throw new Error("Existing feature is not a LineString");
            }

            if (_existingFeature.geometry.coordinates) {
                this._lineFeature.geometry.coordinates = cloneDeep(
                    _existingFeature.geometry.coordinates
                );
            }
        }
        this._setSelectedVertexPosition();

        this._lineFeature.properties!.__line_editor_type = "MAIN_LINE";

        this._fsm = new StateMachine({
            initial: "addPoint",

            transitions: [
                // add points
                "map_selected : addPoint > addPoint",
                "mouse_move : addPoint > addPoint",

                // vertices
                "vertex_selected : addPoint > moveVertex",
                "mouseup : moveVertex > addPoint",
                "mouse_move : moveVertex > moveVertex",
                "vertex_selected : moveVertex > moveVertex",

                // completion
                "escapePressed : * > resetFeature",
                "enterPressed : * > createFeature",
                "featureCreated : createFeature > resetFeature",
            ],
            handlers: {
                "moveVertex@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    this._lineFeature.geometry.coordinates[
                        this._currentFeatureIndex!
                    ] = e.lngLat.toArray();
                    this._markDirty();
                },

                "addPoint@vertex_selected": (
                    _event: string,
                    _fsm: StateMachine,
                    feature: Feature
                ) => {
                    console.log("LineEditorMode: addPoint:vertex_selected");

                    // clicking on the current end vertex completes the edit
                    // const overIndex = feature.properties!.__line_editor_index;
                    // if (overIndex !== undefined) {
                    //     if (
                    //         overIndex ===
                    //         this._lineFeature.geometry.coordinates.length - 1
                    //     ) {
                    //         fsm.do("enterPressed");
                    //         return;
                    //     }
                    // }

                    this._currentFeatureIndex =
                        feature.properties!.__line_editor_index;
                    this._selectedVertexPosition = undefined;

                    if (feature.properties!.__line_editor_type === "MIDPOINT") {
                        const index = this._currentFeatureIndex!;
                        this._lineFeature.geometry.coordinates.splice(
                            index + 1,
                            0,
                            (feature.geometry as any).coordinates
                        );
                        this._currentFeatureIndex = index + 1;
                        this._selectedVertexPosition = undefined;
                        this._markDirty();
                    }
                    this._markDirty();
                },
                "addPoint:enter": () => {
                    console.log("LineEditorMode: addPoint:enter");
                    this._currentFeatureIndex = undefined;
                    this._setSelectedVertexPosition();
                    this._markDirty();
                },
                "addPoint@mouse_move": (
                    _event: string,
                    _fsm: StateMachine,
                    e: MapMouseEvent
                ) => {
                    this._mouseLngLat = e.lngLat;
                    this._markDirty();
                },
                "addPoint@map_selected": (
                    _event: string,
                    _fsm: StateMachine,
                    lngLat: LngLat
                ) => {
                    if (lngLat) {
                        this._lineFeature.geometry.coordinates.push([
                            lngLat.lng,
                            lngLat.lat,
                        ]);
                        this._selectedVertexPosition = lngLat;
                        this._markDirty();
                    }
                },

                resetFeature: () => {
                    console.log("LineEditorMode: resetFeature");

                    this._reset();
                },

                createFeature: (_e: string, fsm: StateMachine) => {
                    console.log("LineEditorMode: createFeature");

                    if (this._lineFeature.geometry.coordinates.length >= 2) {
                        if (this._existingFeature) {
                            this._map._dispatchEvent(
                                "update-feature",
                                lineString(
                                    this._lineFeature.geometry.coordinates,
                                    cloneDeep(this._existingFeature.properties)
                                )
                            );
                        } else {
                            this._map._dispatchEvent(
                                "create-feature",
                                lineString(
                                    this._lineFeature.geometry.coordinates,
                                    cloneDeep(DefaultLineStyle)
                                )
                            );
                        }
                    }
                    fsm.do("escapePressed");
                },
            },
        });
    }

    private _setSelectedVertexPosition() {
        if (this._lineFeature.geometry.coordinates.length > 0) {
            const lastCoord =
                this._lineFeature.geometry.coordinates[
                    this._lineFeature.geometry.coordinates.length - 1
                ];
            this._selectedVertexPosition = new LngLat(
                lastCoord[0],
                lastCoord[1]
            );
        } else {
            this._selectedVertexPosition = undefined;
        }
    }

    protected override _reset() {
        super._reset();
        this._existingFeature = undefined;
        this._lineFeature.geometry.coordinates = [];
        this._selectedVertexPosition = undefined;
        this._mouseLngLat = undefined;
        this._fsm?.go("addPoint");
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._existingFeature = undefined;
        this._lineFeature.geometry.coordinates = [];
        this._geoSource.clear();
    }

    protected override _onMidpointSelected(_midpoint: Feature): void {
        this._fsm?.do("vertex_selected", _midpoint);
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        // create vertex and midpoint features
        const coordinates = this._lineFeature.geometry.coordinates;
        if (coordinates.length < 1) {
            return;
        }
        const midpoints: Position[] = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            const midpoint: Position = [
                (start[0] + end[0]) / 2,
                (start[1] + end[1]) / 2,
            ];
            midpoints.push(midpoint);
        }
        let features: Feature[] = [];
        if (this._lineFeature.geometry.coordinates.length >= 2) {
            features.push(this._lineFeature);
        }
        if (this._selectedVertexPosition && this._mouseLngLat) {
            features.push(
                lineString(
                    [
                        this._selectedVertexPosition.toArray(),
                        this._mouseLngLat.toArray(),
                    ],
                    {
                        ...EditLineStyle,
                        __line_editor_type: "FLOATING_LINE",
                    }
                ) as Feature<LineString, GeoJsonProperties>
            );
        }
        features = [
            ...features,
            ...midpoints.map((coord, index) =>
                makePoint(coord, MidpointStyle, "MIDPOINT", index)
            ),
            ...coordinates.map((coord, index) =>
                makePoint(coord, VertexStyle, "VERTEX", index)
            ),
        ] as Feature[];

        features.forEach((f) => {
            f.properties = f.properties ?? {};
            f.properties.__meta_guid = crypto.randomUUID();
        });

        const collection = featureCollection(features);
        this._geoSource.update(collection);
        this._dirty = false;
    }
}
