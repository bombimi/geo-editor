import { DocumentPropertyMetadata } from "editor/DocumentProperty";

// Metadata for well-known properties of GeoJSON objects
// These properties are commonly used in GeoJSON and have specific types and constraints

const hexColorRegex = "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$";

export const WellKnownProperties: { [key: string]: DocumentPropertyMetadata } =
    {
        // Internal properties
        __meta_guid: {
            type: "string",
            readonly: true,
            displayName: "UniqueId",
            group: "Metadata",
        },
        __meta_type: {
            type: "string",
            readonly: true,
            displayName: "Type",
            group: "Metadata",
        },

        // Editor objects
        __line_editor_type: {
            type: "string",
            readonly: true,
            displayName: "Sub-object Type",
            group: "Metadata",
        },

        // Circle objects
        __geo_editor_circle_radius: {
            group: "Circle",
            type: "number",
            displayName: "Circle Radius",
        },
        __geo_editor_circle_lat: {
            group: "Circle",
            type: "number",
            displayName: "Circle Lat",
        },
        __geo_editor_circle_lng: {
            group: "Circle",
            type: "number",
            displayName: "Circle Lng",
        },

        // Mapbox Simple Style Specification v1.1.0.
        // https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
        //TODO: complete the rest of the properties

        title: { type: "string", displayName: "Title" },
        description: { type: "string", displayName: "Description" },
        "marker-size": {
            group: "Marker style",
            type: "string",
            displayName: "Marker Size",
            options: ["small", "medium", "large"],
            default: "medium",
        },
        "marker-color": {
            group: "Marker style",

            type: "color",
            pattern: hexColorRegex,
            displayName: "Marker Color",
            default: "#7e7e7e",
        },
        "marker-symbol": {
            group: "Marker style",
            type: "string",
            displayName: "Marker Symbol",
        },
        "stroke-width": {
            group: "Stroke style",
            type: "number",
            min: 0,
            step: 1,
            displayName: "Stroke Width",
            default: 2,
        },
        "stroke-opacity": {
            group: "Stroke style",
            type: "number",
            min: 0,
            max: 1,
            step: 0.1,
            displayName: "Stroke Opacity",
            default: 1,
        },
        stroke: {
            group: "Stroke style",
            type: "color",
            pattern: hexColorRegex,
            displayName: "Stroke",
            default: "#555555",
        },
        styleHash: {
            group: "Style",
            type: "string",
            displayName: "Style Hash",
            readonly: true,
        },
        styleMapHash: {
            group: "Style",
            type: "string",
            displayName: "Style Map Hash",
            readonly: true,
        },
        styleUrl: { group: "Style", type: "string", displayName: "Style URL" },
        name: { type: "string", displayName: "Name" },
        fill: {
            type: "color",
            pattern: hexColorRegex,
            displayName: "Fill",
            default: "#555555",
            group: "Fill style",
        },
        "fill-opacity": {
            type: "number",
            min: 0,
            max: 1,
            step: 0.1,
            displayName: "Fill Opacity",
            default: 0.6,
            group: "Fill style",
        },

        // These are mapbox specific?
        "line-dasharray": {
            type: "number-array",
            displayName: "Line Dash Array",
            default: [1],
            group: "Line style",
        },
        "line-color": {
            type: "color",
            pattern: hexColorRegex,
            displayName: "Line Color",
            default: "#555555",
            group: "Line style",
        },
        "line-width": {
            type: "number",
            default: 2,
            displayName: "Line Width",
            group: "Line style",
        },
    };
