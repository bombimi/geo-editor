const DEFAULT_FILL_COLOR = "#e8e8e8";
const DEFAULT_LINE_COLOR = DEFAULT_FILL_COLOR;

export const MapLayers: any[] = [
    {
        id: "map-data-fill",
        type: "fill",
        source: "map-data",
        paint: {
            "fill-color": ["coalesce", ["get", "fill"], DEFAULT_FILL_COLOR],
            "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
        },
        filter: ["==", ["geometry-type"], "Polygon"],
    },
    {
        id: "map-data-fill-outline",
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
        id: "map-data-line",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": ["coalesce", ["get", "stroke"], DEFAULT_LINE_COLOR],
            "line-width": ["coalesce", ["get", "stroke-width"], 8],
            "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
        },
        filter: ["==", ["geometry-type"], "LineString"],
    },
    {
        id: "map-data-line-select",
        type: "line",
        source: "map-data",
        paint: {
            "line-color": "yellow",
            "line-width": 8,
            "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.8, 0],
        },
        filter: ["==", ["geometry-type"], "LineString"],
    },
];
