import { Command, CommandBaseOptions } from "editor/Command";
import { Document } from "editor/Document";
import {
    createDocumentObject,
    SavedDocumentObject,
    saveDocumentObject,
} from "editor/DocumentObjectFactory";
import { GeoObject } from "geo/GeoObject";
import { getFeatureDisplayName } from "geo/Utils";
import { Feature } from "geojson";

export class UpdateFeatureCommand extends Command {
    private _feature: Feature;
    public _savedObject?: SavedDocumentObject;

    constructor(
        args: CommandBaseOptions & {
            feature: Feature;
            savedObject?: SavedDocumentObject;
        }
    ) {
        super(args);
        this._feature = args.feature;
        this._savedObject = args.savedObject;
    }

    public override get name(): string {
        return "UpdateFeatureCommand";
    }

    public override get description(): string {
        return `Update  ${getFeatureDisplayName(this._feature)}`;
    }

    public override do(doc: Document): void {
        const obj = doc.getChild(
            this._feature.properties!.__meta_guid
        ) as GeoObject;
        this._savedObject = saveDocumentObject(obj);
        obj.updateFeature(this._feature);
    }

    public undo(doc: Document): void {
        const obj = doc.getChild(
            this._feature.properties!.__meta_guid
        ) as GeoObject;
        const old = createDocumentObject(this._savedObject!);
        obj.updateFeature((old as GeoObject)!.feature as Feature);
    }

    public override serialize() {
        return Object.assign(super.serialize(), {
            feature: this._feature,
            savedObject: this._savedObject,
        });
    }
}
