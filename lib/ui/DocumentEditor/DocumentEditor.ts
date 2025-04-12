import "@shoelace-style/shoelace/dist/components/split-panel/split-panel.js";

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
            <sl-split-panel id="splitter" vertical>
                <sl-icon slot="divider" name="grip-horizontal"></sl-icon>
                <ds-document-object-tree
                    slot="start"
                    .editorGuid=${this.editorGuid}
                ></ds-document-object-tree>
                <ds-property-editor slot="end" .editorGuid=${this.editorGuid}></ds-property-editor>
            </sl-split-panel>
        `;
    }
}
