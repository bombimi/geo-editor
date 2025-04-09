import { MapMarker } from "./MapMarker";

export * from "./MapMarker";

declare global {
    interface HTMLElementTagNameMap {
        "ds-map-marker": MapMarker;
    }
}
