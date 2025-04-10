import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
import { registerIconLibrary } from "@shoelace-style/shoelace/dist/utilities/icon-library.js";

// Set the base path to lookup assets. In normal production for the app is uses a relative path
// but this can be overridden so the website can also reference the same assets.
if ((window as any).shoelaceBasePath) {
    setBasePath((window as any).shoelaceBasePath);
} else {
    setBasePath("/assets/shoelace");
}

registerIconLibrary("app-icons", {
    resolver: (name) => `/icons/${name}.svg`,
    mutator: (svg) => svg.setAttribute("fill", "currentColor"),
});

export * from "./editor/Editor";

export * from "./ui/EditorWindow";
export * from "./ui/GeoDocumentRenderer";

export * from "./geo/GeoJson";
export * from "./geo/GeoDocumentProviders";

export * from "./mapbox/Map";
export * from "./mapbox/MapMarker";
