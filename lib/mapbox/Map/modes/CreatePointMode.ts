import { MapMouseEvent } from "mapbox-gl";
import { createCustomEvent } from "ui-lib/Utils";
import { GeoJsonSource } from "../GeoJsonSource";
import { InteractionMode } from "../InteractionMode";
import { MapboxMap } from "../MapboxMap";

export class CreatePointMode extends InteractionMode {
    public override displayName = "Create Point mode";
    public override name = "create-point";
    public override description = "Create a point on the map.";
    public override cursor = "crosshair";

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
    }

    public override onClick(e: MapMouseEvent): void {
        console.assert(this.isActive, "CreatePointMode is not active");
        if (e.lngLat) {
            this._map.dispatchEvent(
                createCustomEvent("create-feature", {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [e.lngLat.lng, e.lngLat.lat],
                    },
                })
            );
        }
    }
}
