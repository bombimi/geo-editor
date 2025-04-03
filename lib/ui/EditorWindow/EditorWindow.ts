import "@shoelace-style/shoelace/dist/components/button-group/button-group.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";

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
                              >cavedb.net</a
                          >
                      </div>
                  </div>`}
            <div class="top-left-controls">
                <sl-button-group>
                    <sl-button size="large">Open</sl-button>
                    <sl-button size="large">Save</sl-button>
                    <sl-button size="large">Export</sl-button>
                </sl-button-group>
            </div>
            <div class="top-right-controls">
                <sl-button-group>
                    <sl-icon-button name="plus"></sl-icon-button>
                    <sl-icon-button name="dash-lg"></sl-icon-button>
                </sl-button-group>
                <sl-button size="large">Sign in</sl-button>
            </div>
            <div class="side-right-controls">
                <sl-icon-button name="geo-alt"></sl-icon-button>
                <sl-icon-button src="/images/line.svg"></sl-icon-button>
                <sl-icon-button src="/images/polygon.svg"></sl-icon-button>
                <sl-icon-button name="bounding-box-circles"></sl-icon-button>
                <sl-icon-button name="circle"></sl-icon-button>
            </div>
        </div>`;
    }
}
