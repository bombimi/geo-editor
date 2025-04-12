import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { customElement, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./PropertyEditor.style";
import { SelectionSetChangedEvent } from "../../editor/SelectionSet";
import { DocumentProperty } from "../../editor/DocumentProperty";
import { DocumentObject } from "../../editor/DocumentObject";

@customElement("ds-property-editor")
export class PropertyEditor extends EditorElement {
    static override styles = [styles];

    @state() protected _numSelectedItems = 0;
    @state() protected _properties: DocumentProperty[] = [];
    @state() protected _currentObjects: DocumentObject[] = [];

    protected override _selectionSetChanged(event: SelectionSetChangedEvent): void {
        if (this._editor && this._editor.document) {
            this._numSelectedItems = event.selectionSet.length;
            this._removeEvents();

            this._currentObjects = this._editor.document.getObjectsFromGuids(
                event.selectionSet.array
            );
            this._addEvents();
            this._resetProperties();
        }
    }

    private _resetProperties() {
        this._properties = this._mergeCommonProperties();
    }

    private _removeEvents() {
        // remove all events for existing objects
        this._currentObjects.forEach((obj) => {
            obj.onChange.remove(this._resetProperties.bind(this));
            obj.onDelete.remove(this._resetProperties.bind(this));
            obj.onPropertyChange.remove(this._resetProperties.bind(this));
            obj.onPropertyAdded.remove(this._resetProperties.bind(this));
            obj.onPropertyRemoved.remove(this._resetProperties.bind(this));
        });
    }

    private _addEvents() {
        // add all events for new objects
        this._currentObjects.forEach((obj) => {
            obj.onChange.add(this._resetProperties.bind(this));
            obj.onDelete.add(this._resetProperties.bind(this));
            obj.onPropertyChange.add(this._resetProperties.bind(this));
            obj.onPropertyAdded.add(this._resetProperties.bind(this));
            obj.onPropertyRemoved.add(this._resetProperties.bind(this));
        });
    }

    // Merge all properties that the passed objects have in common. If all values
    // are the same then the value is set to that value. If the values are different then
    // the value is set to null.
    private _mergeCommonProperties() {
        const commonProperties = new Map<string, DocumentProperty>();

        for (const obj of this._currentObjects) {
            for (const prop of obj.properties) {
                if (!commonProperties.has(prop.name)) {
                    commonProperties.set(prop.name, prop.clone());
                } else {
                    const existingProp = commonProperties.get(prop.name)!;
                    if (existingProp.value !== prop.value) {
                        existingProp.value = null; // Different values, set to null
                    }
                }
            }
        }
        return [...commonProperties.values()];
    }

    override render() {
        return html`
            <div class="container">
                <div class="main">
                    <!-- Main content goes here -->
                    <table>
                        ${this._properties.map(
                            (property) => html`
                                <tr>
                                    <td class=${classMap({ readonly: property.readonly })}>
                                        ${property.name}
                                    </td>
                                    <td>${property.value !== null ? property.value : "—"}</td>
                                </tr>
                            `
                        )}
                    </table>
                </div>
                <footer class="footer">
                    <span>Num selected : ${this._numSelectedItems}</span>
                </footer>
            </div>
        `;
    }
}
