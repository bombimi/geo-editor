import { Document } from "../editor/Document";
import { DocumentProvider } from "../editor/DocumentProvider";
import { GeoDocument } from "./GeoDocument";
import { GeoSourceType } from "./GeoJson";

export abstract class GeoDocumentProvider extends DocumentProvider {
    public override get fileExtension(): string {
        // default to the type which is the currently the same as the type
        return this.type;
    }

    public async openDocument(blob: Blob, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(blob, this.type, name);
        return doc;
    }

    public override async saveDocument(document: Document, fileType: string): Promise<string | undefined> {
        return document.save(fileType as GeoSourceType);
    }

}

export class GeoDocumentProviderKml extends GeoDocumentProvider {
    constructor() {
        super("f2862481-259f-4815-9269-730ca5dc0af0");
    }
    public override get type(): string {
        return "kml";
    }

    public override get displayName(): string {
        return "KML";
    }

    public override get mimeType(): string {
        return "application/vnd.google-earth.kml+xml";
    }

    public override get canLoadFileTypes(): string[] {
        return [this.type, this.mimeType]
    }

    public override get canSaveFileType() { return true; }
}

export class GeoDocumentProviderGeoJson extends GeoDocumentProvider {
    constructor() {
        super("1ffc0066-c5ac-43c8-ab46-2b11523371e1");
    }

    public get type(): string {
        return "geojson";
    }

    public get displayName(): string {
        return "Geo JSON";
    }

    public get mimeType(): string {
        return "application/geo+json";
    }

    public get canLoadFileTypes(): string[] {
        return ["geojson", "json"];
    }

    public get canSaveFileType() { return true; }

}

export class GeoDocumentProviderGpx extends GeoDocumentProvider {
    constructor() {
        super("995924bf-f45e-40a4-9543-13da36e63088");
    }

    public get type(): string {
        return "gpx";
    }

    public get displayName(): string {
        return "GPX";
    }

    public get mimeType(): string {
        return "application/gpx+xml";
    }

    public get canLoadFileTypes(): string[] {
        return ["gpx"];
    }
    public get canSaveFileType() { return false; }
}

export function getGeoDocumentProviders(): DocumentProvider[] {
    return [
        new GeoDocumentProviderKml(),
        new GeoDocumentProviderGeoJson(),
        new GeoDocumentProviderGpx(),
    ];
}
