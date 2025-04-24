import { Command, CommandBaseOptions } from "editor/Command";
import { Document } from "editor/Document";
import { Factory } from "geo/objects/Factory";
import { getFeatureDisplayName } from "geo/Utils";
import { Feature } from "geojson";

export class CreateFeatureCommand extends Command {
    private _feature: Feature;
    private _featureGuid?: string;

    constructor(
        args: CommandBaseOptions & { feature: Feature; featureGuid?: string }
    ) {
        super(args);
        this._feature = args.feature;
        this._featureGuid = args.featureGuid;
    }

    public override get name(): string {
        return "CreateFeatureCommand";
    }

    public override get description(): string {
        return `Create ${getFeatureDisplayName(this._feature)}`;
    }

    public override do(doc: Document): void {
        if (!this._featureGuid) {
            this._featureGuid = crypto.randomUUID();
        }
        doc.addChild(Factory.createFeature(this._feature, this._featureGuid));
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
        });
    }
}
