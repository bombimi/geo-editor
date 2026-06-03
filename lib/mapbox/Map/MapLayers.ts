const DEFAULT_FILL_COLOR = "#e8e8e8";
const DEFAULT_LINE_COLOR = "#555555";
const DEFAULT_SELECTION_COLOR = "#FFFF00";
const DEFAULT_FILL_OPACITY = 0.5;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_STANDALONE_LINE_WIDTH = 8;
const DEFAULT_LINE_OPACITY = 1;

const LINE_COLOR_EXPR = [
    "coalesce",
    ["get", "stroke"],
    ["get", "line-color"],
    ["get", "color"],
    DEFAULT_LINE_COLOR,
];

const LINE_WIDTH_EXPR = [
    "to-number",
    [
        "coalesce",
        ["get", "stroke-width"],
        ["get", "line-width"],
        ["get", "width"],
        DEFAULT_LINE_WIDTH,
    ],
    DEFAULT_LINE_WIDTH,
];

const LINE_OPACITY_EXPR = [
    "to-number",
    [
        "coalesce",
        ["get", "stroke-opacity"],
        ["get", "line-opacity"],
        ["get", "opacity"],
        DEFAULT_LINE_OPACITY,
    ],
    DEFAULT_LINE_OPACITY,
];

const MapLayers: any[] = [
    {
        id: "fill",
        type: "fill",
        source: "map-data",
        paint: {
            "fill-color": ["coalesce", ["get", "fill"], DEFAULT_FILL_COLOR],
            "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
        },
        filter: ["==", ["geometry-type"], "Polygon"],
    },

    {
        id: "fill-outline",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": LINE_COLOR_EXPR,
            "line-width": LINE_WIDTH_EXPR,
            "line-opacity": LINE_OPACITY_EXPR,
        },
        filter: ["==", ["geometry-type"], "Polygon"],
    },
    {
        id: "line",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": LINE_COLOR_EXPR,
            "line-width": [
                "to-number",
                [
                    "coalesce",
                    ["get", "stroke-width"],
                    ["get", "line-width"],
                    ["get", "width"],
                    DEFAULT_STANDALONE_LINE_WIDTH,
                ],
                DEFAULT_STANDALONE_LINE_WIDTH,
            ],
            "line-opacity": LINE_OPACITY_EXPR,
            "line-dasharray": [
                "coalesce",
                ["get", "line-dasharray"],
                ["literal", [1]],
            ],
        },
        filter: ["==", ["geometry-type"], "LineString"],
    },

    {
        id: "line-select",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": "yellow",
            "line-width": 8,
            "line-opacity": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                DEFAULT_FILL_OPACITY,
                0,
            ],
        },
        filter: ["==", ["geometry-type"], "LineString"],
    },
    {
        id: "fill-select",
        type: "fill",
        source: "map-data",
        paint: {
            "fill-color": DEFAULT_SELECTION_COLOR,
            "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                DEFAULT_FILL_OPACITY,
                0,
            ],
        },
        filter: ["==", ["geometry-type"], "Polygon"],
    },
    {
        id: "fill-point",
        type: "circle",
        source: "map-data",
        paint: {
            "circle-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                DEFAULT_SELECTION_COLOR,
                ["coalesce", ["get", "fill"], DEFAULT_FILL_COLOR],
            ],
            "circle-radius": ["coalesce", ["get", "circle-radius"], 10],
        },
        filter: ["==", ["geometry-type"], "Point"],
    },
    {
        enabled: false,
        id: "fill-point-select",
        type: "circle",
        source: "map-data",
        paint: {
            "circle-color": DEFAULT_SELECTION_COLOR,
            "circle-radius": 10,
            "circle-opacity": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                DEFAULT_FILL_OPACITY,
                0,
            ],
        },
        filter: ["==", ["geometry-type"], "Point"],
    },
];

export function getMapLayers(source: string): any[] {
    return MapLayers.map((layer) => {
        return {
            ...layer,
            id: `${source}-${layer.id}`,
            source,
        };
    });
}
