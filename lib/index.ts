import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

// Set the base path to lookup assets. In normal production for the app is uses a relative path
// but this can be overridden so the website can also reference the same assets.
if ((window as any).shoelaceBasePath) {
    setBasePath((window as any).shoelaceBasePath);
} else {
    setBasePath("/assets/shoelace");
}

export * from "./core/Editor";
export * from "./ui/EditorWindow";
