import { Map } from "./Map";

export * from "./Map";

declare global {
    interface HTMLElementTagNameMap {
        "ds-map": Map;
    }
}
