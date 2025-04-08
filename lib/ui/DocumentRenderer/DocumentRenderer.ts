import { html, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./DocumentRenderer.style";

import "../../mapbox/Map/Map";
import { Map } from "../../mapbox/Map/Map";
import { StarsStyle } from "./Stars.style";
import { GeoDocument } from "../../geo/GeoDocument";
@customElement("ds-document-renderer")
export class DocumentRenderer extends EditorElement {
    static override styles = [styles, StarsStyle];

    @query("#map") protected _map?: Map;

    public zoomIn() {
        if (this._map) {
            this._map.zoomIn();
        }
    }

    public zoomOut() {
        if (this._map) {
            this._map.zoomOut();
        }
    }

    protected override _editorChanged(): void {
        super._editorChanged();
        this._editorInit();
    }

    private _editorInit() {
        if (this._editor && this._map) {
            const geo = (this._editor?.document as GeoDocument).geoJson;
            if (geo) {
                this._map.addGeoJsonLayer(geo.features);
                const bbox = geo.bbox();

                this._map.fitBounds(bbox.ne, bbox.sw);
            }
        }
    }

    // protected override firstUpdated(changedProperties: PropertyValues): void {
    //     super.firstUpdated(changedProperties);
    //     this._editorInit();
    // }

    override render() {
        return html`<div class="container">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            <ds-map id="map" @map-loaded=${() => this._editorInit()}> </ds-map>
        </div>`;
    }
}
