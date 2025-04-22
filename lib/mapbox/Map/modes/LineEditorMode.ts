import { featureCollection, lineString, point } from "@turf/helpers";
import {
    Feature,
    GeoJsonProperties,
    LineString,
    Point,
    Position,
} from "geojson";
import { cloneDeep, groupBy } from "lodash-es";
import { LngLat, MapMouseEvent, Point as MapboxGLPoint } from "mapbox-gl";
import { StateMachine } from "state-machine/dist/state-machine.js";
import { GeoJsonSource } from "../GeoJsonSource";
import { InteractionMode } from "../InteractionMode";
import { MapboxMap } from "../MapboxMap";

const VertexStyle = {
    fill: "#FF0000",
    "circle-radius": 10,
};

const MidpointStyle = {
    fill: "#FFFF00",
    "circle-radius": 5,
};

const EditLineStyle = {
    stroke: "#FFD580",
    "stroke-width": 2,
    "line-opacity": 1,
    "line-dasharray": [2, 2],
};

const DefaultLineStyle = {
    stroke: "#00FF00",
    "stroke-width": 3,
    "line-opacity": 1,
};

export class LineEditorMode extends InteractionMode {
    public override displayName = "Line Editor mode";
    public override name = "line-editor";
    public override description = "Edit lines on the map.";
    public override cursor = "crosshair";
    public override useEditLayer = true;

    private _fsm: StateMachine.StateMachine;
    private _mouseLngLat: LngLat | undefined;
    private _selectedVertexPosition: LngLat | undefined;
    private _currentFeatureIndex: number | undefined;
    private _dirty = true;

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
                    fsm: StateMachine,
                    feature: Feature
                ) => {
                    console.log("LineEditorMode: addPoint:vertex_selected");

                    // clicking on the current end vertex completes the edit
                    const overIndex = feature.properties!.__line_editor_index;
                    if (overIndex !== undefined) {
                        if (
                            overIndex ===
                            this._lineFeature.geometry.coordinates.length - 1
                        ) {
                            fsm.do("enterPressed");
                            return;
                        }
                    }

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
                    fsm.do("escapePressed");
                },
            },
        });
    }

    private _markDirty() {
        this._dirty = true;
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

    private _reset() {
        this._lineFeature.geometry.coordinates = [];
        this._geoSource.clear();
        this._fsm.go("addPoint");
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._existingFeature = undefined;
        this._lineFeature.geometry.coordinates = [];
        this._geoSource.clear();
    }

    private _makePoint(
        coordinates: Position,
        properties: GeoJsonProperties = VertexStyle,
        type: string,
        index: number
    ): Feature<Point, GeoJsonProperties> {
        return point(coordinates, {
            ...properties,
            __line_editor_index: index,
            __line_editor_type: type,
        }) as Feature<Point, GeoJsonProperties>;
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
                this._makePoint(coord, MidpointStyle, "MIDPOINT", index)
            ),
            ...coordinates.map((coord, index) =>
                this._makePoint(coord, VertexStyle, "VERTEX", index)
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

    private _getFeatureAtScreenLocation(
        point: MapboxGLPoint
    ): Feature | undefined {
        let features = this._geoSource.featuresAtScreenLocation(point);
        let result: Feature | undefined = undefined;

        if (features.length) {
            // exclude the floating line feature
            features = features.filter((f) => {
                const type = f.properties?.__line_editor_type;
                return ["VERTEX", "MIDPOINT", "MAIN_LINE"].includes(type);
            });

            if (features.length) {
                // prefer vertex and midpoint features over the main line feature
                const groupedFeatures = groupBy(features, (f) => {
                    return f.properties?.__line_editor_type;
                });

                if (groupedFeatures["VERTEX"]?.length) {
                    result = groupedFeatures["VERTEX"][0];
                } else if (groupedFeatures["MIDPOINT"]?.length) {
                    result = groupedFeatures["MIDPOINT"][0];
                } else if (groupedFeatures["MAIN_LINE"]?.length) {
                    result = groupedFeatures["MAIN_LINE"][0];
                }
            }
        }
        return result;
    }

    public override onMouseMove(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        const feature = this._getFeatureAtScreenLocation(e.point);
        if (feature) {
            this._setCursor("pointer");
        } else {
            this._setCursor();
        }

        this._fsm.do("mouse_move", e);
    }

    public override onMouseDown(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        const feature = this._getFeatureAtScreenLocation(e.point);
        if (feature) {
            switch (feature.properties!.__line_editor_type) {
                case "VERTEX":
                case "MIDPOINT":
                    this._fsm.do("vertex_selected", feature);
                    break;
            }
        } else {
            this._fsm.do("map_selected", e.lngLat);
        }

        e.preventDefault();
    }

    public override onMouseUp(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        this._fsm.do("mouseup", e);
    }

    public override onKeyDown(e: KeyboardEvent): boolean {
        console.assert(this.isActive, "LineEditorMode is not active");
        if (e.key === "Escape") {
            if (this._lineFeature.geometry.coordinates.length > 0) {
                this._fsm.do("escapePressed");
                return true;
            }
        } else if (e.key === "Enter") {
            this._fsm.do("enterPressed");
            return true;
        }
        return false;
    }
}
