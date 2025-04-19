import { MapMouseEvent } from "mapbox-gl";
import { MapboxMap } from "./MapboxMap";

export abstract class InteractionMode {
    public abstract name: string;
    public abstract displayName: string;
    public abstract description: string;
    public readonly cursor: string = "";

    private _isActive = false;

    constructor(protected _map: MapboxMap) {}

    public get isActive(): boolean {
        return this._isActive;
    }

    public onActivate(): void {
        console.assert(!this._isActive, "InteractionMode is already active.");
        if (this._map.mapboxGL) {
            this._map.mapboxGL.getCanvas().style.cursor = this.cursor;
        }

        this._isActive = true;
    }
    public onDeactivate(): void {
        console.assert(this._isActive, "InteractionMode is not active.");
        this._isActive = false;
    }

    public onDrag(_event: MapMouseEvent): void {}
    public onClick(_event: MapMouseEvent): void {}
    public onMouseMove(_event: MapMouseEvent): void {}
    public onMouseLeave(_event: MapMouseEvent): void {}
}
