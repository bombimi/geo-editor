import { DocumentPropertyMetadata } from "editor/DocumentProperty";

// Metadata for well-known properties of GeoJSON objects
// These properties are commonly used in GeoJSON and have specific types and constraints

export const WellKnownProperties: { [key: string]: DocumentPropertyMetadata } = {
    // Library internal properties
    __meta_guid: { type: "string", readonly: true, displayName: "UniqueId" },
    __meta_type: { type: "string", readonly: true, displayName: "Type" },

    // Mapbox Simple Style Specification v1.1.0.
    // https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
    //TODO: complete the rest of the properties

    "stroke-width": { type: "number", min: 0, step: 1, displayName: "Stroke Width" },
    "stroke-opacity": { type: "number", min: 0, max: 1, step: 0.1, displayName: "Stroke Opacity" },
    stroke: { type: "color", pattern: "^#[0-9A-Fa-f]{6}$", displayName: "Stroke" },
    styleHash: { type: "string", displayName: "Style Hash" },
    styleUrl: { type: "string", displayName: "Style URL" },
    name: { type: "string", displayName: "Name" },
};
