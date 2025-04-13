import { Command } from "../../editor/Command";
import { Document } from "../../editor/Document";
import { GeoDocument } from "../GeoDocument";
import { GeoObject } from "../GeoObject";

export class MoveObjectCommand extends Command {
    constructor(
        selectionSet: string[],
        private _dx: number,
        private _dy: number
    ) {
        super("MoveObject", selectionSet);
    }

    public do(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, this._dx, this._dy);
    }

    public undo(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, -this._dx, -this._dy);
    }

    private _move(geoDoc: GeoDocument, guids: string[], dx: number, dy: number) {
        for (const guid of guids) {
            const feature = geoDoc?.getChild(guid) as GeoObject;
            if (feature) {
                feature.move(dx, dy);
            }
        }
    }
}
