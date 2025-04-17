import { Marker } from "mapbox-gl";
import { MapMarker } from "../MapMarker";

import "../MapMarker";

export type PointMarkerEvent = {
    marker: PointMarker;
};

export type PointMarkerDragEndEvent = PointMarkerEvent & {
    deltaLon: number;
    deltaLat: number;
    guid: string;
};

export type PointMarkerDragEndCallback = (e: PointMarkerDragEndEvent) => void;
export type PointMarkerCallback = (e: PointMarkerEvent) => void;

export class PointMarker extends Marker {
    private _clickHandler?: PointMarkerCallback;
    private _dragEndHandler?: PointMarkerDragEndCallback;

    private _marker?: MapMarker;
    private _originalLngLat?: mapboxgl.LngLat;

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
        this.on("dragstart", () => {
            this._originalLngLat = this.getLngLat();
        });

        this.on("dragend", () => {
            const lnglat = this.getLngLat();
            if (lnglat && this._dragEndHandler && this._originalLngLat) {
                this._dragEndHandler({
                    marker: this,
                    deltaLon: lnglat.lng - this._originalLngLat.lng,
                    deltaLat: lnglat.lat - this._originalLngLat.lat,
                    guid: this.guid,
                });
            }
            this._originalLngLat = undefined;
        });
    }

    public setSelected(selected: boolean): this {
        if (this._marker) {
            this._marker.selected = selected;
            this.setDraggable(selected);
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

    public onClick(callback: PointMarkerCallback): this {
        this._clickHandler = callback;
        return this;
    }

    public onDragEnd(callback: PointMarkerDragEndCallback): this {
        this._dragEndHandler = callback;
        return this;
    }

    override _onMapClick(e: mapboxgl.MapMouseEvent): void {
        const targetElement = e.originalEvent.target;
        const element = this._element;

        if (
            this._clickHandler &&
            (targetElement === element || element.contains(targetElement as Node))
        ) {
            this._clickHandler({ marker: this });
        }
    }
}
