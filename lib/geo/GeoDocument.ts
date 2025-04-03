import { Document } from "../core/Document";
import { GeoJson, GeoSourceType, GeoSourceTypes } from "./GeoJson";

export class GeoDocument extends Document {
    private _geoJson: GeoJson | null = null;

    constructor() {
        super();
    }

    public override async open(blob: Blob, type: string): Promise<void> {
        // Implement the logic to open a GeoDocument from a Blob
        if (!GeoSourceTypes.includes(type as GeoSourceType)) {
            throw new Error(`Unsupported GeoSourceType: ${type}`);
        }

        const srcType = type as GeoSourceType;
        this._geoJson = GeoJson.createFromString(srcType, await blob.text()) ?? null;
        if (!this._geoJson) {
            throw new Error(`Failed to create GeoJson from blob`);
        }
        console.log("Opening GeoDocument", blob);
    }

    public override async save(): Promise<Blob> {
        // Implement the logic to save the GeoDocument to a Blob
        console.log("Saving GeoDocument");
        return new Blob(); // Placeholder for actual Blob
    }
    public override get name(): string {
        return "GeoDocument"; // Placeholder for actual name logic
    }
    public override get type(): string {
        return "application/vnd.geo+json"; // Placeholder for actual type logic
    }
}
