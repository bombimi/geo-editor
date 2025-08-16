import { property, state } from "lit/decorators.js";
import { Editor } from "../editor/Editor";
import { editorManager } from "../editor/EditorManager";
import { BaseElement } from "../ui-lib/BaseElement";
import { watch } from "../ui-utils/watch";

export class EditorElement extends BaseElement {
    @property({ type: String }) editorGuid?: string;

    @state() protected _editor?: Editor;

    @watch("editorGuid")
    _onEditorGuidChange() {
        if (this._editor) {
            this._editor?.selectionSet.onChanged.remove((args: any) =>
                this._selectionSetChanged(args)
            );
            this._editor = undefined;
        }

        if (this.editorGuid) {
            this._editor = editorManager.find(this.editorGuid);
            this._editor?.selectionSet.onChanged.add((args: any) =>
                this._selectionSetChanged(args)
            );

            this._editorChanged();
        }
    }

    protected _editorChanged() {}
    protected _selectionSetChanged(_args: any) {}
}
