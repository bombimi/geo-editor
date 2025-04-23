import { registerCommand } from "editor/CommandFactory";
import { registerDocumentObject } from "editor/DocumentObjectFactory";
import { CreateFeatureCommand } from "./commands/CreateFeatureCommand";
import { MoveObjectCommand } from "./commands/MoveObjectCommand";
import { UpdateFeatureCommand } from "./commands/UpdateFeatureCommand";
import { CircleObject } from "./objects/CircleObject";
import { LineStringObject } from "./objects/LineStringObject";
import { PointObject } from "./objects/PointObject";
import { PolygonObject } from "./objects/PolygonObject";

export function registerGeoDocumentObjects(): void {
    registerDocumentObject("Point", (args) => new PointObject(args));
    registerDocumentObject("LineString", (args) => new LineStringObject(args));
    registerDocumentObject("Polygon", (args) => new PolygonObject(args));
    registerDocumentObject("Circle", (args) => new CircleObject(args));

    registerCommand("MoveObjectCommand", (args) => {
        return new MoveObjectCommand(args);
    });
    registerCommand("CreateFeatureCommand", (args) => {
        return new CreateFeatureCommand(args);
    });
    registerCommand("UpdateFeatureCommand", (args) => {
        return new UpdateFeatureCommand(args);
    });
}
