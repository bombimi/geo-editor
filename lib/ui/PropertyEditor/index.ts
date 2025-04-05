import { PropertyEditor } from "./PropertyEditor";

export * from "./PropertyEditor";

declare global {
    interface HTMLElementTagNameMap {
        "ds-property-editor": PropertyEditor;
    }
}
