import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BaseElement } from "../BaseElement";

import { styles } from "./DocumentRenderer.style";

import "../../mapbox/Map/Map";
@customElement("ds-document-renderer")
export class DocumentRenderer extends BaseElement {
    static override styles = [styles];

    override render() {
        return html`<div class="container">
            <ds-map> </ds-map>
        </div>`;
    }
}
