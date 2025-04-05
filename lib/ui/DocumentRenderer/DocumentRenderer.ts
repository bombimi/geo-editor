import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { BaseElement } from "../BaseElement";

import { styles } from "./DocumentRenderer.style";

import "../../mapbox/Map/Map";
import { Map } from "../../mapbox/Map/Map";
import { StarsStyle } from "./Stars.style";
@customElement("ds-document-renderer")
export class DocumentRenderer extends BaseElement {
    static override styles = [styles, StarsStyle];

    @query("ds-map") protected _mapContainer?: Map;

    public zoomIn() {
        if (this._mapContainer) {
            this._mapContainer.zoomIn();
        }
    }

    public zoomOut() {
        if (this._mapContainer) {
            this._mapContainer.zoomOut();
        }
    }

    override render() {
        return html`<div class="container">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            <ds-map> </ds-map>
        </div>`;
    }
}
