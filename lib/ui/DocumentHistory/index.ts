import { DocumentHistory } from "./DocumentHistory";

export * from "./DocumentHistory";

declare global {
    interface HTMLElementTagNameMap {
        "ds-document-history": DocumentHistory;
    }
}
