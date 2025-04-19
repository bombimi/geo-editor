import { registerCommand } from "editor/CommandFactory";
import { registerDocumentObject } from "editor/DocumentObjectFactory";
import { CreateFeatureCommand } from "./commands/CreateFeatureCommand";
import { MoveObjectCommand } from "./commands/MoveObjectCommand";
import { LineStringObject } from "./objects/LineStringObject";
import { PointObject } from "./objects/PointObject";

export function registerGeoDocumentObjects(): void {
    registerDocumentObject("Point", (args) => new PointObject(args));
    registerDocumentObject("LineString", (args) => new LineStringObject(args));

    registerCommand("MoveObjectCommand", (args) => {
        return new MoveObjectCommand(args);
    });
    registerCommand("CreateFeatureCommand", (args) => {
        return new CreateFeatureCommand(args);
    });
}
