import { featureCollection, lineString, point } from "@turf/helpers";
import {
    Feature,
    GeoJsonProperties,
    LineString,
    Point,
    Position,
} from "geojson";
import { cloneDeep } from "lodash-es";
import { LngLat, MapMouseEvent } from "mapbox-gl";
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

    private _lineFeature = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [] as Position[],
        },
        properties: Object.assign({}, EditLineStyle) as GeoJsonProperties,
    } as Feature<LineString, GeoJsonProperties>;

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
        this._fsm = new StateMachine({
            transitions: [
                // "map_selected : addPoint > addPoint",
                // "vertex_selected : addPoint > moveVertex",
                // "midpoint_selected : addPoint > moveMidpoint",
                // "escapePressed : * > resetFeature",
                // "enterPressed : * > createFeature",
                // "featureCreated : createFeature > resetFeature",
                { action: "map_selected", from: "addPoint", to: "addPoint" },
                {
                    action: "vertex_selected",
                    from: "addPoint",
                    to: "moveVertex",
                },
                {
                    action: "midpoint_selected",
                    from: "addPoint",
                    to: "moveMidpoint",
                },
                { action: "escapePressed", from: "*", to: "resetFeature" },
                { action: "enterPressed", from: "*", to: "createFeature" },
                {
                    action: "featureCreated",
                    from: "createFeature",
                    to: "resetFeature",
                },
            ],
            handlers: {
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
                        this._updateRenderGeometry();
                    }
                },

                resetFeature: () => {
                    this._reset();
                },

                createFeature: (_e: string, fsm: StateMachine) => {
                    this._map._dispatchEvent(
                        "create-feature",
                        lineString(
                            this._lineFeature.geometry.coordinates,
                            cloneDeep(DefaultLineStyle)
                        )
                    );
                    fsm.do("escapePressed");
                },
            },
        });
    }

    private _reset() {
        this._lineFeature.geometry.coordinates = [];
        this._geoSource.clear();
        this._fsm.go("addPoint");
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._geoSource.clear();
    }

    private _makePoint(
        coordinates: Position,
        properties: GeoJsonProperties = VertexStyle
    ): Feature<Point, GeoJsonProperties> {
        return point(coordinates, properties) as Feature<
            Point,
            GeoJsonProperties
        >;
    }

    private _updateRenderGeometry() {
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
        features = [
            ...features,
            ...midpoints.map((coord) => this._makePoint(coord, MidpointStyle)),
            ...coordinates.map((coord) => this._makePoint(coord, VertexStyle)),
        ] as Feature[];

        features.forEach((f) => {
            f.properties = f.properties ?? {};
            f.properties.__meta_guid = crypto.randomUUID();
        });

        const collection = featureCollection(features);
        this._geoSource.update(collection);
    }

    public override onMouseMove(event: MapMouseEvent): void {
        this._fsm.do("mouse_move", event);
        console.assert(this.isActive, "LineEditorMode is not active");
    }

    public override onClick(e: MapMouseEvent): void {
        console.assert(this.isActive, "LineEditorMode is not active");
        this._fsm.do("map_selected", e.lngLat);
        e.preventDefault();
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
