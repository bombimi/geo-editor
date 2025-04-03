import { DocumentRenderer } from "./DocumentRenderer";

export * from "./DocumentRenderer";

declare global {
    interface HTMLElementTagNameMap {
        "ds-document-renderer": DocumentRenderer;
    }
}
