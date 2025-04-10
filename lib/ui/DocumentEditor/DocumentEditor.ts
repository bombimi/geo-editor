import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./DocumentEditor.style";

import "../DocumentObjectTree";
import "../PropertyEditor";

@customElement("ds-document-editor")
export class DocumentEditor extends EditorElement {
    static override styles = [styles];

    override render() {
        return html`
            <ds-document-object-tree .editorGuid=${this.editorGuid}></ds-document-object-tree>
            <ds-property-editor .editorGuid=${this.editorGuid}></ds-property-editor>
        `;
    }
}
