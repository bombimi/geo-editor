import { html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./GeoDocumentRenderer.style";

import { GeoObject } from "geo/GeoObject";
import { CreateFeatureCommand } from "geo/commands/CreateFeatureCommand";
import { UpdateFeatureCommand } from "geo/commands/UpdateFeatureCommand";
import { Feature } from "geojson";
import { GeoDocument } from "../../geo/GeoDocument";
import { Bounds } from "../../geo/GeoJson";
import { MoveObjectCommand } from "../../geo/commands/MoveObjectCommand";
import "../../mapbox/Map/MapboxMap";
import {
    InteractionModes,
    MapboxMap,
    ModeFeaturePair,
} from "../../mapbox/Map/MapboxMap";
import { StarsStyle } from "./Stars.style";

@customElement("ds-document-renderer")
export class GeoDocumentRenderer extends EditorElement {
    static override styles = [styles, StarsStyle];

    @property({ type: Object }) mode: ModeFeaturePair = { mode: "select" };
    @state() private _selectionSet: string[] = [];

    private _bounds?: Bounds;

    @query("#map") protected _map?: MapboxMap;

    public setMode(mode: InteractionModes, feature?: Feature) {
        if (this._map) {
            this._map.setMode(mode, feature);
        }
    }
    public onKeyDown(event: KeyboardEvent) {
        if (this._map) {
            return this._map.onKeyDown(event);
        }
        return false;
    }

    public editFeature(guid: string) {
        if (this._map) {
            const object = this._editor?.document.getChild(guid) as GeoObject;
            this._map.editFeature(object.feature);
        }
    }

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
            this._editor.document?.onChanged.add(() => {
                if (this._editor) {
                    this._setGeo();
                }
            });
            this._setGeo({ fitToBounds: true });
        }
    }

    private _setGeo(options: { fitToBounds?: boolean } = {}) {
        const geo = (this._editor?.document as GeoDocument).geoJson;
        if (this._map && geo) {
            this._map.setGeoJsonLayer(geo.features);
            this._bounds = geo.bbox();

            if (
                options.fitToBounds !== undefined &&
                options.fitToBounds === true
            ) {
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
                @update-feature=${(e: CustomEvent) => {
                    if (this._editor) {
                        this._editor.applyCommand(
                            new UpdateFeatureCommand({
                                selectionSet: [],
                                feature: e.detail as Feature,
                            })
                        );
                    }
                }}
                @move-feature=${(e: CustomEvent) => {
                    if (this._editor) {
                        this._editor.applyCommand(
                            new MoveObjectCommand({
                                selectionSet: e.detail.selectionSet,
                                lat: e.detail.lat,
                                lon: e.detail.lon,
                            })
                        );
                    }
                }}
                @create-feature=${(e: CustomEvent) => {
                    if (this._editor) {
                        this._editor.applyCommand(
                            new CreateFeatureCommand({
                                selectionSet: [],
                                feature: e.detail,
                            })
                        );
                    }
                }}
                @object-selected=${(e: CustomEvent) =>
                    this._objectSelected(e.detail)}
                @set-selection-set=${(e: CustomEvent) => {
                    this._editor?.selectionSet.set(e.detail);
                }}
                @object-moved=${(e: CustomEvent) => {
                    if (this._editor) {
                        this._editor.applyCommand(
                            new MoveObjectCommand({
                                selectionSet:
                                    this._editor.selectionSet.toArray(),
                                lon: e.detail.deltaLon,
                                lat: e.detail.deltaLat,
                            })
                        );
                    }
                }}
            >
            </ds-map>
        </div>`;
    }
}
