import { DocumentObject } from "./DocumentObject";

export type SavedDocumentObject = {
    type: string;
    payload: any;
};

export type DocumentObjectFactoryFunction = (args: any) => DocumentObject;

const factory = new Map<string, DocumentObjectFactoryFunction>();

export function registerDocumentObject(
    name: string,
    factoryFunc: DocumentObjectFactoryFunction
): void {
    factory.set(name, factoryFunc);
}

export function saveDocumentObject(object: DocumentObject): SavedDocumentObject {
    return {
        type: object.type,
        payload: object.serialize(),
    };
}

export function createDocumentObject(saved: SavedDocumentObject): DocumentObject {
    const factoryFunc = factory.get(saved.type);
    if (factoryFunc) {
        return factoryFunc(saved.payload);
    }
    throw new Error("Unknown document object type: " + saved.type);
}
