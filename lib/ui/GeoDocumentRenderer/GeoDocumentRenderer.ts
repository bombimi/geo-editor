import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./GeoDocumentRenderer.style";

import "../../mapbox/Map/MapboxMap";
import { MapboxMap } from "../../mapbox/Map/MapboxMap";
import { StarsStyle } from "./Stars.style";
import { GeoDocument } from "../../geo/GeoDocument";
import { Bounds } from "../../geo/GeoJson";
import { MoveObjectCommand } from "../../geo/modifiers/MoveObject";
@customElement("ds-document-renderer")
export class GeoDocumentRenderer extends EditorElement {
    static override styles = [styles, StarsStyle];

    @state() private _selectionSet: string[] = [];

    private _bounds?: Bounds;

    @query("#map") protected _map?: MapboxMap;

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

    public fitToBounds() {
        if (this._map && this._bounds) {
            this._map.fitBounds(this._bounds.ne, this._bounds.sw);
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
                this._map.setGeoJsonLayer(geo.features);
                this._bounds = geo.bbox();
                this.fitToBounds();
            }
        }
    }

    protected override _selectionSetChanged(_args: any): void {
        super._selectionSetChanged(_args);
        if (this._editor && this._map) {
            this._selectionSet = this._editor.selectionSet.toArray();
        }
    }

    private _objectSelected(guid: string) {
        if (this._editor) {
            this._editor.selectionSet.set([guid]);
        }
    }

    override render() {
        return html`<div class="container">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            <ds-map
                id="map"
                .selectionSet=${this._selectionSet}
                @map-loaded=${() => this._editorInit()}
                @object-selected=${(e: CustomEvent) => this._objectSelected(e.detail)}
                @object-moved=${(e: CustomEvent) => {
                    if (this._editor) {
                        this._editor.applyCommand(
                            new MoveObjectCommand(
                                this._editor.selectionSet.toArray(),
                                e.detail.deltaLon,
                                e.detail.deltaLat
                            )
                        );
                    }
                }}
            >
            </ds-map>
        </div>`;
    }
}
