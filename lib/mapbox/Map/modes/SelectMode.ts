import { InteractionMode } from "../InteractionMode";

import { MapMouseEvent } from "mapbox-gl";
import { createCustomEvent } from "ui-lib/Utils";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";

export class SelectMode extends InteractionMode {
    public override displayName = "Select mode";
    public override name = "select";
    public override description = "Select objects on the map.";
    public override cursor = "pointer";

    private _appendMode = false;
    protected _selectionSet: string[] = [];
    private _hoveredFeatureId?: string | number;

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
    }

    public override onSelectionSetChanged(selectionSet: string[]): void {
        this._selectionSet = selectionSet;
    }

    public override onActivate(): void {
        super.onActivate();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
    }

    public override onKeyDown(e: KeyboardEvent): boolean {
        if (e.key == "Control" && !this._appendMode) {
            console.log("appending");
            this._appendMode = true;
            return true;
        }
        return super.onKeyDown(e);
    }

    public override onKeyUp(e: KeyboardEvent): void {
        if (e.key == "Control") {
            this._appendMode = false;
            console.log("appending stopped");
        }
    }

    public override onClick(e: MapMouseEvent): void {
        console.assert(this.isActive, "SelectMode is not active");
        const features = this._geoSource.featuresAtScreenLocation(e.point);

        if (this._map && features && features.length) {
            const featureIds = features
                .map((x) => this._geoSource.featureGuidFromId(x.id as number))
                .filter((x) => x !== undefined);
            if (this._appendMode) {
                if (this._selectionSet.includes(featureIds[0])) {
                    // remove the feature if it is already in the set
                    this._selectionSet = this._selectionSet.filter(
                        (x) => x !== featureIds[0]
                    );
                } else {
                    // append to the set
                    this._selectionSet = [...this._selectionSet, featureIds[0]];
                }
            } else {
                this._selectionSet = [featureIds[0]];
            }

            this._map.dispatchEvent(
                createCustomEvent("set-selection-set", this._selectionSet)
            );
        }
    }
    public override onMouseLeave(): void {
        console.assert(this.isActive, "SelectMode is not active");

        if (this._map.mapboxGL) {
            if (this._hoveredFeatureId !== undefined) {
                this._geoSource.setSelectionState(
                    this._hoveredFeatureId as number,
                    this._map.selectionSet.includes(
                        this._geoSource.featureGuidFromId(
                            this._hoveredFeatureId as number
                        )!
                    )
                );
            }
            this._hoveredFeatureId = undefined;
            this._setCursor();
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        console.assert(this.isActive, "SelectMode is not active");

        // get features at the mouse position
        const features = this._geoSource.featuresAtScreenLocation(e.point);

        if (this._map.mapboxGL) {
            if (this._hoveredFeatureId) {
                this._geoSource.setSelectionState(
                    this._hoveredFeatureId,
                    this._map.selectionSet.includes(
                        this._geoSource.featureGuidFromId(
                            this._hoveredFeatureId as number
                        )!
                    )
                );
                this._hoveredFeatureId = undefined;
            }
            if (features && features.length) {
                this._hoveredFeatureId = features[0].id;
                this._geoSource.setSelectionState(
                    this._hoveredFeatureId as number,
                    true
                );

                this._setCursor("pointer");
            }
            // // this._map.getCanvas().style.cursor = features && features.length ? "pointer" : "";
        }
    }
}
