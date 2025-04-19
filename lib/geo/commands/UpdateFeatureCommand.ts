import { Command, CommandBaseOptions } from "editor/Command";
import { Document } from "editor/Document";
import { SavedDocumentObject, saveDocumentObject } from "editor/DocumentObjectFactory";
import { GeoObject } from "geo/GeoObject";
import { Feature } from "geojson";

export class UpdateFeatureCommand extends Command {
    private _feature: Feature;
    private _featureGuid?: string;
    public _savedObject?: SavedDocumentObject;

    constructor(args: CommandBaseOptions & { feature: Feature; featureGuid: string }) {
        super(args);
        this._feature = args.feature;
        this._featureGuid = args.featureGuid;
    }

    public override get name(): string {
        return "UpdateFeatureCommand";
    }

    public override get description(): string {
        return `Update ${this._feature.geometry.type}`;
    }

    public override do(doc: Document): void {
        if (!this._featureGuid) {
            this._featureGuid = crypto.randomUUID();
        }
        const obj = doc.getChild(this._featureGuid) as GeoObject;
        this._savedObject = saveDocumentObject(obj);
        obj.updateFeature(this._feature);
    }

    public undo(doc: Document): void {
        if (this._featureGuid) {
            doc.removeChild(this._featureGuid);
        }
    }

    public override serialize() {
        return Object.assign(super.serialize(), {
            feature: this._feature,
            featureGuid: this._featureGuid,
            savedObject: this._savedObject,
        });
    }
}
