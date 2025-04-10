import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./PropertyEditor.style";
import { SelectionSetChangedEvent } from "../../editor/SelectionSet";

@customElement("ds-property-editor")
export class PropertyEditor extends EditorElement {
    static override styles = [styles];

    @state() protected _numSelectedItems = 0;

    protected override _selectionSetChanged(event: SelectionSetChangedEvent): void {
        this._numSelectedItems = event.selectionSet.length;
    }

    override render() {
        return html`
            <div class="container">
                <div class="main">
                    <!-- Main content goes here -->
                </div>
                <footer class="footer">
                    <span>Num selected : ${this._numSelectedItems}</span>
                </footer>
            </div>
        `;
    }
}
