import { InteractionMode } from "../InteractionMode";

import { MapMouseEvent } from "mapbox-gl";
import { createCustomEvent } from "ui-lib/Utils";
import { MapboxMap } from "../MapboxMap";

export class SelectMode extends InteractionMode {
    public override displayName = "Select mode";
    public override name = "select";
    public override description = "Select objects on the map.";

    private _hoveredFeatureId: string | number | undefined;

    constructor(map: MapboxMap) {
        super(map);
    }

    public override onActivate(): void {
        super.onActivate();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
    }

    public override onClick(e: MapMouseEvent): void {
        if (this._map && e.features && e.features.length) {
            this._map.dispatchEvent(
                createCustomEvent(
                    "object-selected",
                    this._map.featureGuidFromID(e.features[0].id as number)
                )
            );
        }
    }
    public override onMouseLeave(): void {
        if (this._map.mapboxGL) {
            if (this._hoveredFeatureId !== undefined) {
                this._map.mapboxGL.setFeatureState(
                    {
                        source: "map-data",
                        id: this._hoveredFeatureId as number,
                    },
                    {
                        selected: this._map.selectionSet.includes(
                            this._map.featureGuidFromID(
                                this._hoveredFeatureId as number
                            )!
                        ),
                    }
                );
            }
            this._hoveredFeatureId = undefined;
            this._map.mapboxGL.getCanvas().style.cursor = "";
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        if (this._map.mapboxGL) {
            if (this._hoveredFeatureId) {
                this._map.mapboxGL.setFeatureState(
                    { source: "map-data", id: this._hoveredFeatureId },
                    { selected: false }
                );
                this._hoveredFeatureId = undefined;
            }
            if (e.features && e.features.length) {
                this._hoveredFeatureId = e.features[0].id;
                this._map.mapboxGL.setFeatureState(
                    {
                        source: "map-data",
                        id: this._hoveredFeatureId as number,
                    },
                    { selected: true }
                );
                this._map.mapboxGL.getCanvas().style.cursor = "pointer";
            }
            // // this._map.getCanvas().style.cursor = features && features.length ? "pointer" : "";
        }
    }
}
