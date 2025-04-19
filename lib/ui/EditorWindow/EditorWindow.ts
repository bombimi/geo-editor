import "@shoelace-style/shoelace/dist/components/button-group/button-group.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import "@shoelace-style/shoelace/dist/components/tab-group/tab-group.js";
import "@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js";
import "@shoelace-style/shoelace/dist/components/tab/tab.js";

import { html, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { EditorElement } from "../EditorElement";

import { styles } from "./EditorWindow.style";

import { Document } from "../../editor/Document";
import { DocumentProvider } from "../../editor/DocumentProvider";
import { Editor } from "../../editor/Editor";
import {
    GeoDocumentProviderGeoJson,
    getGeoDocumentProviders,
} from "../../geo/GeoDocumentProviders";
import { GeoDocumentRenderer } from "../GeoDocumentRenderer";

import { UndoBufferArgs, UndoBufferEventArgs } from "editor/UndoBuffer";
import { DeleteObjectCommand } from "editor/commands/DeleteObjectCommand";
import { showToast } from "ui-lib/Utils";
import "../DocumentEditor";
import "../DocumentHistory";

const EditorWindowModes = [
    {
        icon: "cursor-fill",
        iconset: "default",
        mode: "select",
    },
    {
        icon: "geo-alt",
        iconset: "default",
        mode: "draw-point",
    },
    {
        icon: "line",
        iconset: "app-icons",
        mode: "draw-line-string",
    },
    {
        icon: "polygon",
        iconset: "app-icons",
        mode: "draw-polygon",
    },
    {
        icon: "rectangle",
        iconset: "app-icons",
        mode: "draw-rectangle",
    },
    {
        icon: "circle",
        iconset: "default",
        mode: "draw-circle",
    },
];

@customElement("ds-editor-window")
export class EditorWindow extends EditorElement {
    static override styles = [styles];

    @property({ type: String }) mode = "select";

    @state() protected _document: Document | null = null;
    @state() protected _hasUndo = false;
    @state() protected _hasRedo = false;
    @state() protected _darkMode = true;
    @state() protected _deleteEnabled = false;

    @query("ds-document-renderer")
    protected _documentRenderer?: GeoDocumentRenderer;

    private _boundHandleKeyDown = this._handleKeyDown.bind(this);

    constructor() {
        super();
        console.log("EditorWindow constructor");
    }
    private _handleKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === "z") {
                event.preventDefault();
                if (this._hasUndo) {
                    this._editor?.undo();
                }
            } else if (event.key === "y") {
                event.preventDefault();
                if (this._hasRedo) {
                    this._editor?.redo();
                }
            } else if (event.key === "a") {
                this._editor?.selectAll();
            }
        } else if (event.key === "Escape" || event.key === "Esc") {
            this._editor?.clearSelection();
            this.mode = "select";
        }
    }

    protected override _selectionSetChanged(_args: any): void {
        super._selectionSetChanged(_args);
        if (this._editor) {
            this._deleteEnabled = this._editor.selectionSet.length > 0;
        }
    }

    protected override _editorChanged(): void {
        super._editorChanged();
        if (this._editor) {
            this._editor.undoBuffer.onChanged.add(
                this._updateUndoRedo.bind(this)
            );
            this._editor.undoBuffer.onCaretChanged.add(
                this._updateUndoRedo.bind(this)
            );
        }
    }

    override connectedCallback() {
        super.connectedCallback();
        this._darkMode = document.body.classList.contains("sl-theme-dark");
        window.addEventListener("keydown", this._boundHandleKeyDown);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("keydown", this._boundHandleKeyDown);
    }

    protected override firstUpdated(_changedProperties: PropertyValues): void {
        super.firstUpdated(_changedProperties);

        // load the last document from local storage if it exists
        let lastDoc = window.localStorage.getItem("lastDocument");
        let lastDocName = window.localStorage.getItem("lastDocumentName");
        let lastDocMimeType = window.localStorage.getItem(
            "lastDocumentMimeType"
        );
        let docProvider = window.localStorage.getItem("lastDocumentProvider");

        // see if we have a current auto save
        const lastAutoSave = window.localStorage.getItem("lastAutoSave");
        const lastAutoSaveUndoBuffer = window.localStorage.getItem(
            "lastAutoSaveUndoBuffer"
        );

        if (lastAutoSave) {
            lastDoc = lastAutoSave;
            lastDocMimeType = "application/json";
            lastDocName = "autosave.json";
            docProvider = new GeoDocumentProviderGeoJson().id;
            showToast("Restoring from auto save");
        }

        let undoBufferArgs: UndoBufferArgs | undefined;
        if (lastAutoSaveUndoBuffer) {
            try {
                undoBufferArgs = JSON.parse(lastAutoSaveUndoBuffer);
            } catch (e) {
                console.error("Error parsing undo buffer", e);
            }
        }

        if (lastDoc && lastDocName && lastDocMimeType && docProvider) {
            const provider = getGeoDocumentProviders().find(
                (p) => p.id === docProvider
            );
            if (provider) {
                const blob = new Blob([lastDoc], { type: lastDocMimeType });
                this._openFile(provider, blob, lastDocName, undoBufferArgs);
            }
        }
    }

    private async _saveCurrentState() {
        if (this._editor && this._document) {
            const saved = await this._document.save();
            window.localStorage.setItem("lastAutoSave", saved);
            window.localStorage.setItem(
                "lastAutoSaveUndoBuffer",
                JSON.stringify(this._editor.undoBuffer.serialize())
            );
        }
    }

    private _toggleDarkMode() {
        this._darkMode = !this._darkMode;
        document
            .getElementsByTagName("body")[0]
            ?.classList.toggle("sl-theme-dark");
        this.requestUpdate();
    }

    private _updateUndoRedo(args: UndoBufferEventArgs) {
        this._hasUndo = args.canUndo;
        this._hasRedo = args.canRedo;
    }

    private async _openFile(
        provider: DocumentProvider,
        blob: Blob,
        name: string,
        undoBufferArgs?: UndoBufferArgs
    ) {
        this._document = await provider.openDocument(blob, name);
        const editor = new Editor(this._document, undoBufferArgs);
        this.editorGuid = editor.guid;

        this._document.onChanged.add(() => {
            this._saveCurrentState();
        });

        this._hasUndo = editor.undoBuffer.canGoBack();
        this._hasRedo = editor.undoBuffer.canGoForward();

        return this._document;
    }

    private _deleteSelectedObjects() {
        if (this._editor) {
            this._editor.applyCommand(
                new DeleteObjectCommand({
                    selectionSet: this._editor.selectionSet.toArray(),
                })
            );
        }
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
                if (
                    await this._openFile(
                        provider,
                        input.files[0],
                        input.files[0].name,
                        undefined
                    )
                ) {
                    const text = await input.files[0].text();
                    window.localStorage.setItem("lastDocument", text);
                    window.localStorage.setItem(
                        "lastDocumentProvider",
                        provider.id
                    );
                    window.localStorage.setItem(
                        "lastDocumentName",
                        input.files[0].name
                    );
                    window.localStorage.setItem(
                        "lastDocumentMimeType",
                        input.files[0].type
                    );
                    window.localStorage.removeItem("lastAutoSave");
                    window.localStorage.removeItem("lastAutoSaveUndoBuffer");
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
                ? html`<ds-document-renderer
                      .mode=${this.mode}
                      .editorGuid=${this._editor?.guid}
                  ></ds-document-renderer>`
                : html`<div class="no-document-container">
                      <div class="no-document-inner">
                          <span class="no-document-text">geoEditor</span>
                          <a
                              class="no-document-tagline"
                              href="https://www.cavedb.net"
                              >cavedb.net</a
                          >
                      </div>
                  </div>`}
            <div class="top-left-controls">
                <sl-button-group>
                    <sl-dropdown
                        ><sl-button slot="trigger" size="large" caret
                            >Open</sl-button
                        >
                        <sl-menu>
                            ${getGeoDocumentProviders().map(
                                (provider) =>
                                    html`<sl-menu-item
                                        value="open"
                                        @click=${() =>
                                            this._promptForFile(provider)}
                                        >${provider.name}</sl-menu-item
                                    >`
                            )}
                        </sl-menu></sl-dropdown
                    >
                    <sl-button size="large" ?disabled=${this._document === null}
                        >Save</sl-button
                    >
                    <sl-button size="large" ?disabled=${this._document === null}
                        >Export</sl-button
                    >
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
                        @click=${() => this._documentRenderer?.zoomIn()}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="dash-lg"
                        ?disabled=${this._document === null}
                        @click=${() => this._documentRenderer?.zoomOut()}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="app"
                        ?disabled=${this._document === null}
                        @click=${() => this._documentRenderer?.fitToBounds()}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="arrow-counterclockwise"
                        ?disabled=${!this._hasUndo}
                        @click=${() => this._editor?.undo()}
                    ></sl-icon-button>
                    <sl-icon-button
                        name="arrow-clockwise"
                        ?disabled=${!this._hasRedo}
                        @click=${() => this._editor?.redo()}
                    ></sl-icon-button>
                </sl-button-group>
                <sl-button size="large">Sign in</sl-button>
            </div>
            <div class="side-right-controls">
                <sl-icon-button
                    name="trash3"
                    ?disabled=${!this._deleteEnabled}
                    @click=${() => this._deleteSelectedObjects()}
                ></sl-icon-button>
                <span></span>
                ${EditorWindowModes.map(
                    (mode) =>
                        html`<sl-icon-button
                            class=${classMap({
                                active: this.mode === mode.mode,
                            })}
                            name=${mode.icon}
                            library=${ifDefined(mode.iconset)}
                            @click=${() => {
                                this.mode = mode.mode;
                            }}
                        ></sl-icon-button>`
                )}
            </div>
            <div class="left-panels">
                <sl-tab-group>
                    <sl-tab slot="nav" panel="objects">Objects</sl-tab>
                    <sl-tab slot="nav" panel="history">History</sl-tab>

                    <sl-tab-panel name="objects">
                        <ds-document-editor
                            .editorGuid=${this._editor?.guid}
                        ></ds-document-editor>
                    </sl-tab-panel>
                    <sl-tab-panel name="history">
                        <ds-document-history
                            .editorGuid=${this._editor?.guid}
                        ></ds-document-history>
                    </sl-tab-panel>
                </sl-tab-group>
            </div>
        </div>`;
    }
}
