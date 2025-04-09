import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { styles } from "./MapMarker.style";
import { watch } from "../../ui-utils/watch";

@customElement("ds-map-marker")
export class MapMarker extends LitElement {
    static override styles = [styles];

    @property({ type: Boolean }) selected = false;
    @property({ type: String }) icon?: string;
    @property({ type: String }) name?: string;
    @property({ type: String }) guid?: string;

    @watch("selected")
    _onSelectedChanged() {
        if (this.selected) {
            this.classList.add("selected");
        } else {
            this.classList.remove("selected");
        }
    }

    override render() {
        return html`<div class="container">
            <sl-icon .name=${this.icon}></sl-icon><span>${this.name}</span>
        </div>`;
    }
}
