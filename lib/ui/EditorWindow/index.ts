import { EditorWindow } from "./EditorWindow";

export * from "./EditorWindow";

declare global {
    interface HTMLElementTagNameMap {
        "ds-editor-window": EditorWindow;
    }
}
