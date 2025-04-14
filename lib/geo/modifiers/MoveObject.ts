import { Command } from "../../editor/Command";
import { Document } from "../../editor/Document";
import { GeoDocument } from "../GeoDocument";
import { GeoObject } from "../GeoObject";

export type MoveObjectArgs = {
    lat: number;
    lon: number;
};
export class MoveObjectCommand extends Command {
    constructor(
        selectionSet: string[],
        private _args: MoveObjectArgs
    ) {
        super("MoveObject", selectionSet);
    }

    public do(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, this._args.lat, this._args.lon);
    }

    public undo(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, -this._args.lat, -this._args.lon);
    }

    //TODO: handle MultiPoint, need to take an index to move
    private _move(geoDoc: GeoDocument, guids: string[], lat: number, lon: number) {
        for (const guid of guids) {
            const feature = geoDoc?.getChild(guid) as GeoObject;
            if (feature) {
                feature.move(lat, lon);
            }
        }
    }
}
