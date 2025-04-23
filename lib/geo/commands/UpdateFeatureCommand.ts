import { Command, CommandBaseOptions } from "editor/Command";
import { Document } from "editor/Document";
import {
    createDocumentObject,
    SavedDocumentObject,
    saveDocumentObject,
} from "editor/DocumentObjectFactory";
import { GeoObject } from "geo/GeoObject";
import { Feature } from "geojson";

export class UpdateFeatureCommand extends Command {
    private _feature: Feature;
    public _savedObject?: SavedDocumentObject;

    constructor(
        args: CommandBaseOptions & { feature: Feature; featureGuid: string }
    ) {
        super(args);
        this._feature = args.feature;
    }

    public override get name(): string {
        return "UpdateFeatureCommand";
    }

    public override get description(): string {
        return `Update ${this._feature.geometry.type}`;
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
