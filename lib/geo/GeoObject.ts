import { Feature } from "geojson";
import { cloneDeep } from "lodash-es";
import { camelCaseToReadable } from "ui-lib/Utils";
import {
    DocumentObject,
    DocumentPropertyEvent,
} from "../editor/DocumentObject";
import {
    DocumentProperty,
    getPropertyMetadata,
} from "../editor/DocumentProperty";
import {} from "./WellKnownProperties";

export abstract class GeoObject extends DocumentObject {
    protected _featureIsDirty = true;

    public constructor(
        protected _type: string,
        protected _feature: Feature,
        guid?: string
    ) {
        super();

        const properties: DocumentProperty[] = [];
        if (_feature.properties) {
            for (const [key, value] of Object.entries(_feature.properties)) {
                properties.push(
                    new DocumentProperty(key, value, getPropertyMetadata(key))
                );
            }
        } else {
            _feature.properties = {};
        }

        this.onPropertyAdded.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyChanged.add((e: DocumentPropertyEvent) =>
            this._upsertProperty(e.property.name, e.property.value)
        );
        this.onPropertyRemoved.add((e: DocumentPropertyEvent) => {
            delete this._feature.properties![e.property.name];
        });

        super.init(_type, properties, guid);
    }

    public updateFeature(feature: Feature): void {
        this._feature = feature;
        this.onChanged.raise(this);
    }

    public get isValid(): boolean {
        return this._feature.geometry !== null;
    }

    public override serialize() {
        return cloneDeep(this.feature);
    }

    public override get displayType() {
        return camelCaseToReadable(this.type);
    }

    public abstract move(deltaLat: number, deltaLon: number): void;

    private _upsertProperty(name: string, value: any): void {
        this._feature.properties![name] = value;
    }

    protected _updateFeature(): void {}

    public get feature(): Feature {
        if (this._featureIsDirty) {
            this._updateFeature();
            this._featureIsDirty = false;
        }
        return this._feature;
    }
}
