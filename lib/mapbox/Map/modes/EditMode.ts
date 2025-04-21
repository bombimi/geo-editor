import { MapMouseEvent } from "mapbox-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { SelectMode } from "./SelectMode";

export class EditMode extends SelectMode {
    public override displayName = "Edit mode";
    public override name = "edit";
    public override description = "Edit features on the map.";
    public override cursor = "pointer";

    constructor(map: MapboxMap, geoSource: GeoJsonSource) {
        super(map, geoSource);
    }

    public override onClick(e: MapMouseEvent): void {
        console.assert(this.isActive, "EditMode is not active");
        const features = this._geoSource.featuresAtScreenLocation(e.point);
        if (
            this._map &&
            features &&
            features.length &&
            features[0].properties
        ) {
            const feature = this._geoSource.featureFromGuid(
                features[0].properties.__meta_guid
            );
            if (feature) {
                this._map.editFeature(feature);
            }
        }
    }
}
