import { Feature } from "geojson";
import { checkIsCircle } from "./objects/CircleObject";

export function getFeatureDisplayName(feature: Feature): string {
    if (checkIsCircle(feature)) {
        return "Circle";
    }

    return feature.geometry.type;
}
