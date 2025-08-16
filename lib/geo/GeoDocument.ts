import { DocumentProperty } from "editor/DocumentProperty";
import { Document } from "../editor/Document";
import { GeoJson, GeoSourceType, GeoSourceTypes } from "./GeoJson";
import { GeoObject } from "./GeoObject";
import { Factory } from "./objects/Factory";

export class GeoDocument extends Document {
    private _geoJson: GeoJson | null = null;
    private _type?: string;

    constructor() {
        super();
        super.init("root");
    }

    public override get sourceFilename(): string | undefined {
        return this.name;

    }

    public override get sourceFileType(): string | undefined {
        return this._type;
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

    public override async open(
        blob: Blob,
        type: string,
        name: string
    ): Promise<void> {
        if (!GeoSourceTypes.includes(type as GeoSourceType)) {
            throw new Error(`Unsupported GeoSourceType: ${type}`);
        }

        const srcType = type as GeoSourceType;
        this._geoJson =
            GeoJson.createFromString(srcType, await blob.text()) ?? null;
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
        this.updateProperty(
            new DocumentProperty("__meta_source_filename", this.sourceFilename, {
                type: "string",
                readonly: true,
                displayName: "Source filename",
            }));
        this.updateProperty(
            new DocumentProperty("__meta_source_type", this.sourceFileType, {
                type: "string",
                readonly: true,
                displayName: "Source type",
            }));


        console.log("Opening GeoDocument", blob);
    }

    public override async save(fileType: GeoSourceType): Promise<string | undefined> {
        // Implement the logic to save the GeoDocument to a Blob
        const geoJson = this.geoJson;
        return geoJson?.save(fileType);

    }

    public override get name(): string {
        return this._geoJson?.name ?? "Untitled";
    }

    public override get type(): string {
        return this._type ?? "";
    }
}
