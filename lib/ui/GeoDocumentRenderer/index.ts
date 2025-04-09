import { GeoDocumentRenderer } from "./GeoDocumentRenderer";

export * from "./GeoDocumentRenderer";

declare global {
    interface HTMLElementTagNameMap {
        "ds-document-renderer": GeoDocumentRenderer;
    }
}
