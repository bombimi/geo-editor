import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js";

import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { choose } from "lit/directives/choose.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { customElement, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { styles } from "./PropertyEditor.style";
import { SelectionSetChangedEvent } from "../../editor/SelectionSet";
import { DocumentProperty } from "../../editor/DocumentProperty";
import { DocumentObject } from "../../editor/DocumentObject";
import { SetPropertyCommand } from "../../editor/commands/SetPropertyCommand";

@customElement("ds-property-editor")
export class PropertyEditor extends EditorElement {
    static override styles = [styles];

    @state() protected _numSelectedItems = 0;
    @state() protected _mergedProperties: DocumentProperty[] = [];
    @state() protected _currentObjects: DocumentObject[] = [];

    protected override _editorChanged(): void {
        super._editorChanged();
        this._editor?.document.onChange.add(() => {
            this._resetObjects();
        });
    }

    protected _resetObjects() {
        this._removeEvents();
        this._numSelectedItems = this._editor?.selectionSet.length ?? 0;
        this._currentObjects =
            this._editor?.document.getObjectsFromGuids(
                this._editor?.selectionSet.toArray() ?? []
            ) ?? [];
        this._addEvents();
        this._resetProperties();
    }

    protected override _selectionSetChanged(): void {
        if (this._editor && this._editor.document) {
            this._resetObjects();
        }
    }

    private _resetProperties() {
        this._mergedProperties = this._mergeCommonProperties();
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

    private _getPropertyInputType(property: DocumentProperty) {
        switch (property.type) {
            case "number":
                return "number";
            default:
                return "text";
        }
    }

    private _updateProperty(property: DocumentProperty, value: any) {
        const newProp = property.clone();
        newProp.value = value;
        this._editor?.applyCommand(
            new SetPropertyCommand(this._editor.selectionSet.toArray(), newProp)
        );
    }

    private _getInputSuffix(property: DocumentProperty) {
        switch (property.units) {
            case "meters":
                return "m";
            default:
                return property.units ?? "";
        }
    }

    private _renderInputProperty(property: DocumentProperty) {
        return html` <sl-input
            .type=${this._getPropertyInputType(property)}
            ?disabled=${property.readonly}
            pill
            filled
            min=${ifDefined(property.metadata.min)}
            max=${ifDefined(property.metadata.max)}
            step=${ifDefined(property.metadata.step)}
            pattern=${ifDefined(property.metadata.pattern)}
            size="small"
            clearable
            value=${property.value !== null ? property.value : "—"}
            @sl-input=${(e: any) => {
                if (!e.target.validity.valid) {
                    return;
                }
                const newProp = property.clone();
                if (property.type === "number") {
                    newProp.value = parseFloat(e.target.value);
                } else {
                    newProp.value = e.target.value;
                }
                this._editor?.applyCommand(
                    new SetPropertyCommand(this._editor.selectionSet.toArray(), newProp)
                );
            }}
        >
            <span slot="suffix">${this._getInputSuffix(property)}</span>
        </sl-input>`;
    }

    private _renderColorProperty(property: DocumentProperty) {
        return html` <div class="color-property">
            ${this._renderInputProperty(property)}
            <sl-color-picker
                size="small"
                .disabled=${property.readonly}
                .value=${property.value}
                @sl-change=${(e: any) => {
                    this._updateProperty(property, e.target.value);
                }}
            ></sl-color-picker>
        </div>`;
    }

    private _renderProperty(property: DocumentProperty) {
        return choose(property.type, [
            ["number", () => this._renderInputProperty(property)],
            ["string", () => this._renderInputProperty(property)],
            ["color", () => this._renderColorProperty(property)],
        ]);
    }

    override render() {
        return html`
            <div class="container">
                <div class="main">
                    <!-- Main content goes here -->
                    <div class="two-column-grid">
                        ${this._mergedProperties.map(
                            (property) => html`
                                <span class=${classMap({ readonly: property.readonly })}>
                                    ${property.name}
                                </span>
                                ${this._renderProperty(property)}
                            `
                        )}
                    </div>
                </div>
                <footer class="footer">
                    <span>Num selected : ${this._numSelectedItems}</span>
                </footer>
            </div>
        `;
    }
}
