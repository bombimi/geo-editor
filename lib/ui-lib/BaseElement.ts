import { LitElement } from "lit";
import { createCustomEvent } from "./Utils";

export class BaseElement extends LitElement {
    public _dispatchEvent(name: string, details: any) {
        this.dispatchEvent(createCustomEvent(name, details));
    }
}
