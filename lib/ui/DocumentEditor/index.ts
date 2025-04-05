import { DocumentEditor } from "./DocumentEditor";

export * from "./DocumentEditor";

declare global {
    interface HTMLElementTagNameMap {
        "ds-document-editor": DocumentEditor;
    }
}
