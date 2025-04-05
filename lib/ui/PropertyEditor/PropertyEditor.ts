import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BaseElement } from "../BaseElement";

import { styles } from "./PropertyEditor.style";

@customElement("ds-property-editor")
export class PropertyEditor extends BaseElement {
    static override styles = [styles];

    override render() {
        return html``;
    }
}


