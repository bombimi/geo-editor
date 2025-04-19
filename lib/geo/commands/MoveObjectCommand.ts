import { Command, CommandBaseOptions } from "../../editor/Command";
import { Document } from "../../editor/Document";
import { GeoDocument } from "../GeoDocument";
import { GeoObject } from "../GeoObject";

export type MoveObjectArgs = CommandBaseOptions & {
    lat: number;
    lon: number;
};

export class MoveObjectCommand extends Command {
    private lat = 0;
    private lon = 0;

    constructor(args: MoveObjectArgs) {
        super(args);
        if (args.lat !== undefined) {
            this.lat = args.lat;
        }
        if (args.lon !== undefined) {
            this.lon = args.lon;
        }
    }

    public override get name(): string {
        return "MoveObjectCommand";
    }

    public do(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, this.lat, this.lon);
    }

    public undo(document: Document) {
        this._move(document as GeoDocument, this._selectionSet, -this.lat, -this.lon);
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

    public override serialize() {
        return {
            base: super.serialize(),
            lat: this.lat,
            lon: this.lon,
        };
    }
}
