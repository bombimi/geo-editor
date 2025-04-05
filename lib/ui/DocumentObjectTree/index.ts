import { DocumentObjectTree } from "./DocumentObjectTree";

export * from "./DocumentObjectTree";

declare global {
    interface HTMLElementTagNameMap {
        "ds-document-object-tree": DocumentObjectTree;
    }
}
