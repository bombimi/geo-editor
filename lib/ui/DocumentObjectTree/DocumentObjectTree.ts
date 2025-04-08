import "@shoelace-style/shoelace/dist/components/tree/tree.js";
import "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { html, HTMLTemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./DocumentObjectTree.style";
import { Document } from "../../core/Document";
import { watch } from "../../ui-utils/watch";
import { DocumentObject } from "../../core/DocumentObject";
import SlTreeItem from "@shoelace-style/shoelace/dist/components/tree-item/tree-item.js";

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

    @watch("_document")
    _onDocumentChange() {
        this._tree = undefined;
        if (this._document) {
            this._makeTree();
        }
    }

    private _makeTree() {
        if (this._document && this._document.root)
            this._tree = html`<sl-tree selection="single">
                >${this._makeTreeAux(this._document.root)}</sl-tree
            >`;
        else this._tree = html``;
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
                const tree = item.parentElement as SlTreeItem;
                const items = tree.querySelectorAll("sl-tree-item");
                items.forEach((i) => {
                    if (i !== item) {
                        i.classList.remove("selected");
                    }
                });
                this._editor.selectionSet.clear();
            }
            this._editor.selectionSet.toggle(guid);
            item.classList.toggle("selected");
        }
    }

    private _makeTreeAux(object: DocumentObject): HTMLTemplateResult {
        return html`<sl-tree-item
            ?expanded=${this._document!.root === object}
            @click=${(e: Event) => this._selectItem(e)}
            data-guid=${object.guid}
        >
            <sl-icon
                .library=${typeToIcon(object.type).source}
                .name=${typeToIcon(object.type).name}
            >
            </sl-icon>
            ${object.type === "root" ? object.name : `${object.type}`}
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
