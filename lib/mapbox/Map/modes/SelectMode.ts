import { InteractionMode } from "../InteractionMode";

import { SelectionSet } from "editor/SelectionSet";
import { MapMouseEvent, Point } from "mapbox-gl";
import { createCustomEvent } from "ui-lib/Utils";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";

export class SelectMode extends InteractionMode {
    public override displayName = "Select mode";
    public override name = "select";
    public override description = "Select objects on the map.";
    public override cursor = "pointer";

    protected _appendMode = false;
    protected _selectionSet = new SelectionSet();
    protected _hoveredFeatureId?: string | number;

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        featureSource: GeoJsonSource
    ) {
        super(map, geoSource, featureSource);
    }

    public override onSelectionSetChanged(selectionSet: string[]): void {
        this._selectionSet = new SelectionSet(selectionSet);
    }

    public override onActivate(): void {
        super.onActivate();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
    }

    public override onKeyDown(e: KeyboardEvent): boolean {
        if (e.ctrlKey && !this._appendMode) {
            console.log("appending");
            this._appendMode = true;
            return true;
        }
        return super.onKeyDown(e);
    }

    public override onKeyUp(_e: KeyboardEvent): void {
        this._appendMode = false;
        console.log("appending stopped");
    }

    public override onClick(e: MapMouseEvent): void {
        console.assert(this.isActive, "SelectMode is not active");
        this._updateSelectionSet(e.point, e.originalEvent.ctrlKey);
    }

    public override onMouseLeave(): void {
        console.assert(this.isActive, "SelectMode is not active");

        if (this._map.mapboxGL) {
            if (this._hoveredFeatureId !== undefined) {
                this._featureSource.setSelectionState(
                    this._hoveredFeatureId as number,
                    this._map.selectionSet.includes(
                        this._featureSource.featureGuidFromId(
                            this._hoveredFeatureId as number
                        )!
                    )
                );
            }
            this._hoveredFeatureId = undefined;
            this._appendMode = false;
            this._setCursor();
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        console.assert(this.isActive, "SelectMode is not active");

        // get features at the mouse position
        const features = this._featureSource.featuresAtScreenLocation(e.point);

        const reset = (id: number) => {
            const guid = this._featureSource.featureGuidFromId(id) as string;
            if (!this._selectionSet.contains(guid)) {
                this._featureSource.setSelectionState(id, false);
            }
        };

        if (this._map.mapboxGL) {
            const haveFeatures = features && features.length;
            if (this._hoveredFeatureId) {
                if (haveFeatures) {
                    if (features[0].id !== this._hoveredFeatureId) {
                        reset(this._hoveredFeatureId as number);
                        this._hoveredFeatureId = features[0].id;
                    }
                } else {
                    reset(this._hoveredFeatureId as number);
                    this._hoveredFeatureId = undefined;
                }
            } else {
                if (features && features.length) {
                    this._hoveredFeatureId = features[0].id;
                    this._featureSource.setSelectionState(
                        this._hoveredFeatureId as number,
                        true
                    );

                    this._setCursor("pointer");
                }
            }
            // // this._map.getCanvas().style.cursor = features && features.length ? "pointer" : "";
        }
    }

    protected _updateSelectionSet(point: Point, append: boolean): void {
        const feature = this._featureSource.featureAtScreenLocation(point);

        if (this._map && feature && this._featureSource) {
            const featureGuid = this._featureSource.featureGuidFromId(
                feature.id as number
            );

            if (featureGuid) {
                if (append) {
                    if (this._selectionSet.contains(featureGuid)) {
                        this._selectionSet.remove(featureGuid);
                    } else {
                        this._selectionSet.add(featureGuid);
                    }
                } else {
                    this._selectionSet = new SelectionSet([featureGuid]);
                }

                this._raiseSelectionSetChangedEvent();
            }
        }
    }

    protected _raiseSelectionSetChangedEvent() {
        this._map.dispatchEvent(
            createCustomEvent("set-selection-set", this._selectionSet.toArray())
        );
    }
}
