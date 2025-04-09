import { Marker } from "mapbox-gl";

export type ClickableMarkerCallback = () => void;

import "../MapMarker";

import { MapMarker } from "../MapMarker";

export class ClickableMarker extends Marker {
    private _clickHandler?: ClickableMarkerCallback;
    private _marker?: MapMarker;

    public constructor(
        options: mapboxgl.MarkerOptions,
        name: string,
        public readonly guid: string
    ) {
        const elem = document.createElement("ds-map-marker");
        elem.setAttribute("name", name);
        elem.setAttribute("icon", "circle-fill");

        options.element = elem;
        options.anchor = "left";
        super(options);
        this._marker = elem as MapMarker;
    }

    public setSelected(selected: boolean): this {
        if (this._marker) {
            this._marker.selected = selected;
        }
        return this;
    }

    public override setLngLat(lnglat: mapboxgl.LngLatLike): this {
        super.setLngLat(lnglat);
        return this;
    }

    public override remove(): this {
        super.remove();
        return this;
    }

    public onClick(callback: ClickableMarkerCallback): this {
        this._clickHandler = callback;
        return this;
    }

    override _onMapClick(e: mapboxgl.MapMouseEvent): void {
        const targetElement = e.originalEvent.target;
        const element = this._element;

        if (
            this._clickHandler &&
            (targetElement === element || element.contains(targetElement as Node))
        ) {
            this._clickHandler();
        }
    }
}
