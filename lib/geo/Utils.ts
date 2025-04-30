import { Feature } from "geojson";
import { checkIsCircle } from "./objects/CircleObject";
import { checkIsRectangle } from "./objects/RectangleObject";

export function getFeatureDisplayName(feature: Feature): string {
    if (checkIsCircle(feature)) {
        return "Circle";
    } else if (checkIsRectangle(feature)) {
        return "Rectangle";
    }

    return feature.geometry.type;
}
