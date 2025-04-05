import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { watch } from "../ui-utils/watch";
import { editorManager } from "../core/EditorManager";
import { Editor } from "../core/Editor";

export class BaseElement extends LitElement {
    @property({ type: String }) editorGuid?: string;

    @state() protected _editor?: Editor;

    @watch("editorGuid")
    _onEditorGuidChange() {
        this._editor = undefined;
        if (this.editorGuid) {
            this._editor = editorManager.find(this.editorGuid);
            this._editorChanged();
        }
    }

    protected _editorChanged() {}
}
