import { Document } from "../core/Document";
import { DocumentObject, DocumentObjectProperty } from "../core/DocumentObject";
import { GeoJson, GeoSourceType, GeoSourceTypes } from "./GeoJson";

export class GeoDocument extends Document {
    private _geoJson: GeoJson | null = null;
    private _type?: string;

    constructor() {
        super();
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

        const root = new DocumentObject(this._geoJson.name);
        for (const feature of this._geoJson.features.features) {
            if (feature.geometry && feature.geometry.type === "Polygon") {
                root.addChild(new DocumentObject(feature.properties!.name, "Polygon", root));
                console.log("Processing Polygon feature", feature);
            } else if (feature.geometry && feature.geometry.type === "Point") {
                const properties: DocumentObjectProperty[] = [];
                if (feature.properties) {
                    for (const [key, value] of Object.entries(feature.properties)) {
                        properties.push({
                            name: key,
                            value: value,
                            type: "string",
                        });
                    }
                }
                root.addChild(
                    new DocumentObject(feature.properties!.name, "Point", root, properties)
                );

                console.log("Processing Point feature", feature);
            } else {
                console.log("Processing other feature type", feature);
            }
        }
        this.root = root;

        console.log("Opening GeoDocument", blob);
    }

    public override async save(): Promise<Blob> {
        // Implement the logic to save the GeoDocument to a Blob
        console.log("Saving GeoDocument");
        return new Blob(); // Placeholder for actual Blob
    }

    public override get name(): string {
        return this._geoJson?.name ?? "Untitled";
    }

    public override get type(): string {
        return this._type ?? "";
    }
}
