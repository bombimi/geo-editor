import { Document } from "../editor/Document";
import { GeoJson, GeoSourceType, GeoSourceTypes } from "./GeoJson";
import { GeoObject } from "./GeoObject";
import { Factory } from "./objects/Factory";

export class GeoDocument extends Document {
    private _geoJson: GeoJson | null = null;
    private _type?: string;

    constructor() {
        super("root");
    }

    public get geoJson(): GeoJson | null {
        return new GeoJson({
            type: "FeatureCollection",
            features: this.children
                .map((child) => child as GeoObject)
                .filter((child) => child.isValid)
                .map((child) => child.feature),
        });
    }

    public override async open(blob: Blob, type: string, name: string): Promise<void> {
        if (!GeoSourceTypes.includes(type as GeoSourceType)) {
            throw new Error(`Unsupported GeoSourceType: ${type}`);
        }

        const srcType = type as GeoSourceType;
        this._geoJson = GeoJson.createFromString(srcType, await blob.text()) ?? null;
        if (!this._geoJson) {
            throw new Error(`Failed to create GeoJson from blob`);
        }
        this._geoJson.name = name;
        this._type = type;

        for (const feature of this._geoJson.features.features) {
            const type = feature.geometry.type;
            if (type) {
                const obj = this.addChild(Factory.createFeature(feature));
                if (!feature.properties) {
                    feature.properties = {};
                }
                feature.properties.__meta_guid = obj.guid;
            }
        }

        console.log("Opening GeoDocument", blob);
    }

    public override async save(): Promise<string> {
        // Implement the logic to save the GeoDocument to a Blob
        return JSON.stringify({
            type: "FeatureCollection",
            features: this.children.map((child) => (child as GeoObject).feature),
        });
    }

    public override get name(): string {
        return this._geoJson?.name ?? "Untitled";
    }

    public override get type(): string {
        return this._type ?? "";
    }
}
