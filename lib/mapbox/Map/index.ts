import { MapboxMap } from "./MapboxMap";

export * from "./MapboxMap";

declare global {
    interface HTMLElementTagNameMap {
        "ds-map": MapboxMap;
    }
}
