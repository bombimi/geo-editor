const DEFAULT_FILL_COLOR = "#e8e8e8";
const DEFAULT_LINE_COLOR = DEFAULT_FILL_COLOR;
const DEFAULT_SELECTION_COLOR = "#FFFF00";
const DEFAULT_FILL_OPACITY = 0.5;

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
            "line-color": ["coalesce", ["get", "stroke"], DEFAULT_LINE_COLOR],
            "line-width": ["coalesce", ["get", "stroke-width"], 2],
            "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
        },
        filter: ["==", ["geometry-type"], "Polygon"],
    },
    {
        id: "line",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": ["coalesce", ["get", "stroke"], DEFAULT_LINE_COLOR],
            "line-width": ["coalesce", ["get", "stroke-width"], 8],
            "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
            "line-dasharray": ["coalesce", ["get", "line-dasharray"], [1]],
        },
        filter: ["==", ["geometry-type"], "LineString"],
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
