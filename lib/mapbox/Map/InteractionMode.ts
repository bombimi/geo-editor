import { MapMouseEvent } from "mapbox-gl";
import { GeoJsonSource } from "./GeoJsonSource";
import { MapboxMap } from "./MapboxMap";

export abstract class InteractionMode {
    public abstract name: string;
    public abstract displayName: string;
    public abstract description: string;
    public readonly cursor: string = "";
    public readonly useEditLayer: boolean = false;

    private _isActive = false;

    constructor(
        protected _map: MapboxMap,
        protected _geoSource: GeoJsonSource
    ) {}

    protected _setCursor(cursor?: string): void {
        this._map.mapboxGL!.getCanvas().style.cursor = cursor ?? this.cursor;
    }

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

    public render(): void {}
    public onSelectionSetChanged(_selectionSet: string[]): void {}
    public onDrag(_event: MapMouseEvent): void {}
    public onClick(_event: MapMouseEvent): void {}
    public onMouseDown(_event: MapMouseEvent): void {}
    public onMouseUp(_event: MapMouseEvent): void {}
    public onMouseMove(_event: MapMouseEvent): void {}
    public onMouseLeave(_event: MapMouseEvent): void {}
    public onKeyDown(_event: KeyboardEvent): boolean {
        return false;
    }
}
