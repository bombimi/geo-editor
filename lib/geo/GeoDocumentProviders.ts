import { Document } from "../core/Document";
import { DocumentProvider } from "../core/DocumentProvider";
import { GeoDocument } from "./GeoDocument";

export class GeoDocumentProviderKml extends DocumentProvider {
    public get name(): string {
        return "KML";
    }

    public fileTypes(): string[] {
        return ["kml"];
    }

    public async openDocument(file: File, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(file, "kml", name);
        return doc;
    }
}

export class GeoDocumentProviderGeoJson extends DocumentProvider {
    public get name(): string {
        return "Geo JSON";
    }
    public fileTypes(): string[] {
        return ["geojson", "json"];
    }

    public async openDocument(file: File, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(file, "geojson", name);
        return doc;
    }
}

export class GeoDocumentProviderGpx extends DocumentProvider {
    public get name(): string {
        return "GPX";
    }
    public fileTypes(): string[] {
        return ["gpx"];
    }

    public async openDocument(file: File, name: string): Promise<Document> {
        const doc = new GeoDocument();
        await doc.open(file, "gpx", name);
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
