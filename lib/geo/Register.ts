import { LineStringObject } from "./objects/LineStringObject";
import { MoveObjectCommand } from "./modifiers/MoveObject";
import { PointObject } from "./objects/PointObject";
import { registerCommand } from "editor/CommandFactory";
import { registerDocumentObject } from "editor/DocumentObjectFactory";

export function registerGeoDocumentObjects(): void {
    registerDocumentObject("Point", (args) => new PointObject(args));
    registerDocumentObject("LineString", (args) => new LineStringObject(args));

    registerCommand("MoveObjectCommand", (args) => {
        return new MoveObjectCommand(args);
    });
}
