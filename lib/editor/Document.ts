import { GeoSourceType } from "geo/GeoJson";
import { DocumentObject } from "./DocumentObject";

export abstract class Document extends DocumentObject {
    public abstract get sourceFilename(): string | undefined;
    public abstract get sourceFileType(): string | undefined;
    public abstract open(blob: Blob, type: string, name: string): Promise<void>;
    public abstract save(type: GeoSourceType): Promise<string | undefined>;
}
