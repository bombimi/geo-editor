import { Document } from "../editor/Document";
import { DocumentProvider } from "../editor/DocumentProvider";
import { GeoDocument } from "./GeoDocument";

export class GeoDocumentProviderKml extends DocumentProvider {
    constructor() {
        super("f2862481-259f-4815-9269-730ca5dc0af0");
    }
    public get name(): string {
        return "KML";
    }

    public fileTypes(): string[] {
        return ["kml", "application/vnd.google-earth.kml+xml"];
    }

    public async openDocument(blob: Blob, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(blob, "kml", name);
        return doc;
    }
}

export class GeoDocumentProviderGeoJson extends DocumentProvider {
    constructor() {
        super("1ffc0066-c5ac-43c8-ab46-2b11523371e1");
    }

    public get name(): string {
        return "Geo JSON";
    }
    public fileTypes(): string[] {
        return ["geojson", "json"];
    }

    public async openDocument(blob: Blob, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(blob, "geojson", name);
        return doc;
    }
}

export class GeoDocumentProviderGpx extends DocumentProvider {
    constructor() {
        super("995924bf-f45e-40a4-9543-13da36e63088");
    }
    public get name(): string {
        return "GPX";
    }
    public fileTypes(): string[] {
        return ["gpx"];
    }

    public async openDocument(blob: Blob, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(blob, "gpx", name);
        return doc;
    }
}

export function getGeoDocumentProviders(): DocumentProvider[] {
    return [
        new GeoDocumentProviderKml(),
        new GeoDocumentProviderGeoJson(),
        new GeoDocumentProviderGpx(),
    ];
}
