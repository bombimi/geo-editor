import "@shoelace-style/shoelace/dist/components/tree/tree.js";
import "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { html, HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./DocumentObjectTree.style";
import { Document } from "../../editor/Document";
import { watch } from "../../ui-utils/watch";
import { DocumentObject } from "../../editor/DocumentObject";
import SlTreeItem from "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";
import { SelectionSet } from "../../editor/SelectionSet";

function typeToIcon(type: string) {
    switch (type) {
        default:
        case "Point":
            return {
                name: "geo-alt",
                source: "default",
            };
    }
}
@customElement("ds-document-object-tree")
export class DocumentObjectTree extends EditorElement {
    static override styles = [styles];

    @state() protected _document: Document | null = null;
    @state() protected _tree?: HTMLTemplateResult;

    private _selectionSet = new SelectionSet();

    @watch("_document")
    _onDocumentChange() {
        this._tree = undefined;
        if (this._document) {
            this._makeTree();
        }
    }

    protected override _selectionSetChanged() {
        if (this._editor) {
            if (!this._selectionSet.isEqual(this._editor.selectionSet)) {
                this._clearSelectionClasses();
                const firstItem = this._setSelectionClasses(this._editor.selectionSet.toArray());
                if (firstItem) {
                    firstItem.scrollIntoView({ block: "center", behavior: "smooth" });
                }
                this._selectionSet = this._editor.selectionSet.clone();
            }
        }
    }

    private _makeTree() {
        if (this._document)
            this._tree = html`<sl-tree selection="single">
                >${this._makeTreeAux(this._document)}</sl-tree
            >`;
        else this._tree = html``;
    }

    private _clearSelectionClasses() {
        if (this._editor) {
            const items = this.shadowRoot!.querySelectorAll("sl-tree-item");
            items.forEach((i) => {
                i.classList.remove("selected");
            });
        }
    }

    private _setSelectionClasses(selectionSet: string[]) {
        let firstSelectedItem: SlTreeItem | undefined;

        if (this._editor) {
            const items = this.shadowRoot!.querySelectorAll("sl-tree-item");

            items.forEach((item) => {
                if (selectionSet.includes(item.dataset.guid as string)) {
                    if (!firstSelectedItem) {
                        firstSelectedItem = item as SlTreeItem;
                    }
                    item.classList.add("selected");
                }
            });
        }

        return firstSelectedItem;
    }

    private _selectItem(e: any) {
        if (e.eventPhase !== Event.AT_TARGET) {
            return;
        }
        if (this._editor) {
            const item = e.target as SlTreeItem;
            const guid = item.dataset.guid as string;
            const control = e.ctrlKey || e.metaKey;
            if (!control) {
                this._clearSelectionClasses();
                this._selectionSet.clear();
            }
            this._selectionSet.toggle(guid);
            item.classList.toggle("selected");

            // do this as the last step as we decided whether to scroll the container
            // when the selection changes based on whether we set it or not
            this._editor.selectionSet.set(this._selectionSet.toArray());
        }
    }

    private _makeTreeAux(object: DocumentObject): HTMLTemplateResult {
        return html`<sl-tree-item
            ?expanded=${this._document === object}
            @click=${(e: Event) => this._selectItem(e)}
            data-guid=${object.guid}
        >
            <sl-icon
                .library=${typeToIcon(object.type).source}
                .name=${typeToIcon(object.type).name}
            >
            </sl-icon>
            ${object.type === "root" ? object.displayName : `${object.displayType}`}
            ${object.properties
                .filter((p) => !["type"].includes(p.name))
                .map(
                    (p) =>
                        html`<sl-tree-item
                            ><div class="property">
                                <span class="name">${p.name}: </span
                                ><span class="value">${p.value}</span>
                            </div></sl-tree-item
                        >`
                )}
            ${object.children.map((child) => this._makeTreeAux(child))}
        </sl-tree-item> `;
    }

    protected override _editorChanged() {
        super._editorChanged();
        if (this._editor) {
            this._document = this._editor.document;
            this._makeTree();
        }
    }

    override render() {
        return html`${this._tree}`;
    }
}
