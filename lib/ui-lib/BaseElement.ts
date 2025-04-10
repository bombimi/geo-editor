import { LitElement } from "lit";

export class BaseElement extends LitElement {
    public _dispatchEvent(name: string, details: any) {
        const event = new CustomEvent(name, {
            bubbles: true,
            composed: true,
            detail: details,
        });
        this.dispatchEvent(event);
    }
}
