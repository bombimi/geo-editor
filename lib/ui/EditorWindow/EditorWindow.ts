import "@shoelace-style/shoelace/dist/components/button-group/button-group.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";

import { html, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { BaseElement } from "../BaseElement";

import { styles } from "./EditorWindow.style";

import { DocumentRenderer } from "../DocumentRenderer";
import { Document } from "../../core/Document";
import { Editor } from "../../core/Editor";
import { DocumentProvider } from "../../core/DocumentProvider";

@customElement("ds-editor-window")
export class EditorWindow extends BaseElement {
    static override styles = [styles];

    @state() protected _editor = new Editor();
    @state() protected _document: Document | null = null;
    @state() protected _hasUndo = false;
    @state() protected _hasRedo = false;
    @state() protected _darkMode = true;

    constructor() {
        super();
        console.log("EditorWindow constructor");
        this._editor.providers.forEach((provider) => console.log(provider.name));
    }

    override connectedCallback() {
        super.connectedCallback();
        this._darkMode = document.body.classList.contains("sl-theme-dark");

        // this._editor.addEventListener("documentChanged", (e) => {
        //     this._hasUndo = this._editor.canUndo;
        //     this._hasRedo = this._editor.canRedo;
        //     this.requestUpdate();
        // });
        // this._editor.addEventListener("documentOpened", (e) => {
        //     this._document = e.detail.document;
        //     this.requestUpdate();
        // });
    }

    protected override firstUpdated(_changedProperties: PropertyValues): void {
        super.firstUpdated(_changedProperties);

        // load the last document from local storage if it exists
        const lastDoc = window.localStorage.getItem("lastDocument");
        const lastDocName = window.localStorage.getItem("lastDocumentName");
        const lastDocMimeType = window.localStorage.getItem("lastDocumentMimeType");
        const lastDocProvider = window.localStorage.getItem("lastDocumentProvider");
        if (lastDoc && lastDocName && lastDocMimeType && lastDocProvider) {
            const provider = this._editor.providers.find((p) => p.id === lastDocProvider);
            if (provider) {
                const blob = new Blob([lastDoc], { type: lastDocMimeType });
                this._openFile(provider, blob, lastDocName);
            }
        }
    }

    private _toggleDarkMode() {
        this._darkMode = !this._darkMode;
        document.getElementsByTagName("body")[0]?.classList.toggle("sl-theme-dark");
        this.requestUpdate();
    }

    private async _openFile(provider: DocumentProvider, blob: Blob, name: string) {
        this._document = this._editor.document = await provider.openDocument(blob, name);
        return this._document;
    }

    private _promptForFile(provider: DocumentProvider) {
        const input = Object.assign(document.createElement("input"), {});

        input.id = "media-import-input";
        input.type = "file";
        input.multiple = false;
        input.style = "visibility:collapse; display:none";
        input.accept = `${provider
            .fileTypes()
            .map((t) => `.${t}`)
            .join(",")}`;

        input.addEventListener("change", async () => {
            if (input.files) {
                if (await this._openFile(provider, input.files[0], input.files[0].name)) {
                    const text = await input.files[0].text();
                    window.localStorage.setItem("lastDocument", text);
                    window.localStorage.setItem("lastDocumentProvider", provider.id);
                    window.localStorage.setItem("lastDocumentName", input.files[0].name);
                    window.localStorage.setItem("lastDocumentMimeType", input.files[0].type);
                }
            }
            document.body.removeChild(input);
        });
        input.addEventListener("oncancel", () => {
            document.body.removeChild(input);
        });
        document.body.append(input);
        input.click();
    }

    override render() {
        return html`<div class="editor-window">
            ${this._document
                ? html`<ds-document-renderer></ds-document-renderer>`
                : html`<div class="no-document-container">
                      <div class="no-document-inner">
                          <span class="no-document-text">geoEditor</span>
                          <a class="no-document-tagline" href="https://www.cavedb.net"
                              >cavedb.net</a
                          >
                      </div>
                  </div>`}
            <div class="top-left-controls">
                <sl-button-group>
                    <sl-dropdown
                        ><sl-button slot="trigger" size="large" caret>Open</sl-button>
                        <sl-menu>
                            ${this._editor.providers.map(
                                (provider) =>
                                    html`<sl-menu-item
                                        value="open"
                                        @click=${() => this._promptForFile(provider)}
                                        >${provider.name}</sl-menu-item
                                    >`
                            )}
                        </sl-menu></sl-dropdown
                    >
                    <sl-button size="large" ?disabled=${this._document === null}>Save</sl-button>
                    <sl-button size="large" ?disabled=${this._document === null}>Export</sl-button>
                </sl-button-group>
            </div>
            <div class="top-right-controls">
                <sl-button-group>
                    <sl-icon-button
                        .name=${this._darkMode ? "moon-fill" : "moon"}
                        @click=${() => this._toggleDarkMode()}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="plus"
                        ?disabled=${this._document === null}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="dash-lg"
                        ?disabled=${this._document === null}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="arrow-counterclockwise"
                        ?disabled=${!this._hasUndo}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="arrow-clockwise"
                        ?disabled=${!this._hasRedo}
                    ></sl-icon-button>
                </sl-button-group>
                <sl-button size="large">Sign in</sl-button>
            </div>
            <div class="side-right-controls">
                <sl-icon-button name="geo-alt"></sl-icon-button>
                <sl-icon-button library="app-icons" name="line"></sl-icon-button>
                <sl-icon-button library="app-icons" name="polygon"></sl-icon-button>
                <sl-icon-button library="app-icons" name="rectangle"></sl-icon-button>
                <sl-icon-button name="circle"></sl-icon-button>
            </div>
            ${this._document
                ? html` <div class="status-bar">
                      <span>${this._document.name}</span>
                  </div>`
                : html``}
        </div>`;
    }
}
