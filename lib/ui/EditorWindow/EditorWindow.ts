import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BaseElement } from "../BaseElement";

import { styles } from "./EditorWindow.style";

import { DocumentRenderer } from "../DocumentRenderer";
import { Document } from "../../core/Document";

@customElement("ds-editor-window")
export class EditorWindow extends BaseElement {
    static override styles = [styles];

    @state() private _document: Document | null = null;

    override render() {
        return html`<div class="editor-window">
            ${this._document
                ? html`<ds-document-renderer></ds-document-renderer>`
                : html`<div class="no-document-container">
                      <div class="no-document-inner">
                          <span class="no-document-text">Geo Editor</span>
                          <a class="no-document-tagline" href="https://www.cavedb.net"
                              >https://www.cavedb.net</a
                          >
                      </div>
                  </div>`}
        </div>`;
    }
}
