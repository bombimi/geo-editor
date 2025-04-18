import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";

import { html, TemplateResult } from "lit";
import { choose } from "lit/directives/choose.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { customElement, state } from "lit/decorators.js";
import { EditorElement } from "../EditorElement";

import { WellKnownPropertiesArray } from "geo/WellKnownProperties";
import { DocumentObject } from "../../editor/DocumentObject";
import { DocumentProperty } from "../../editor/DocumentProperty";
import { SetPropertyCommand } from "../../editor/commands/SetPropertyCommand";
import { styles } from "./PropertyEditor.style";

type TreeNode = {
    group: string;
    children: TreeNode[];
    items: DocumentProperty[];
};

function getPropertiesByGroup(
    props: DocumentProperty[],
    keep: (prop: DocumentProperty) => boolean = () => true
): TreeNode {
    const root: TreeNode = { group: "root", children: [], items: [] };

    for (const prop of props) {
        if (!keep(prop)) {
            continue;
        }
        let currentNode = root;

        if (prop.metadata.group) {
            if (prop.metadata.group === "Metadata") {
                continue; // Skip metadata properties
            }
            const groups = prop.metadata.group.split(",").map((g) => g.trim());

            for (const group of groups) {
                let childNode = currentNode.children.find((child) => child.group === group);

                if (!childNode) {
                    childNode = { group, children: [], items: [] };
                    currentNode.children.push(childNode);
                }

                currentNode = childNode;
            }
        }
        currentNode.items.push(prop);
    }

    return root;
}

@customElement("ds-property-editor")
export class PropertyEditor extends EditorElement {
    static override styles = [styles];

    @state() protected _numSelectedItems = 0;
    @state() protected _mergedProperties: DocumentProperty[] = [];
    @state() protected _currentObjects: DocumentObject[] = [];
    @state() protected _addPropertyDropdown?: TemplateResult;
    @state() protected _removePropertyDropdown?: TemplateResult;

    protected override _editorChanged(): void {
        super._editorChanged();
        this._editor?.document.onChanged.add(() => {
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
        this._createAddPropertyDropdown();
        this._createRemovePropertyDropdown();
    }

    private _removeEvents() {
        // remove all events for existing objects
        this._currentObjects.forEach((obj) => {
            obj.onChanged.remove(this._resetProperties.bind(this));
            obj.onDeleted.remove(this._resetProperties.bind(this));
            obj.onPropertyChanged.remove(this._resetProperties.bind(this));
            obj.onPropertyAdded.remove(this._resetProperties.bind(this));
            obj.onPropertyRemoved.remove(this._resetProperties.bind(this));
        });
    }

    private _addEvents() {
        // add all events for new objects
        this._currentObjects.forEach((obj) => {
            obj.onChanged.add(this._resetProperties.bind(this));
            obj.onDeleted.add(this._resetProperties.bind(this));
            obj.onPropertyChanged.add(this._resetProperties.bind(this));
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
        // order by readonly first, then by displayName
        const sortedProperties = [...commonProperties.values()].sort((a, b) => {
            if (a.readonly && !b.readonly) return 1;
            if (!a.readonly && b.readonly) return -1;
            return a.displayName.localeCompare(b.displayName);
        });
        return [...sortedProperties.values()];
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
            new SetPropertyCommand({
                selectionSet: this._editor.selectionSet.toArray(),
                property: newProp,
            })
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

    private _getInputPropertyValue(property: DocumentProperty) {
        if (property.value === null) {
            return "--";
        }
        if (property.type === "number-array") {
            return property.value.join(", ");
        }

        return property.value;
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
            value=${this._getInputPropertyValue(property)}
            @sl-input=${(e: any) => {
                if (!e.target.validity.valid) {
                    return;
                }
                const newProp = property.clone();
                if (property.type === "number") {
                    newProp.value = parseFloat(e.target.value);
                } else if (property.type === "number-array") {
                    let value = e.target.value.trim();
                    value = value.replace(/\s+/g, "");

                    const numbers = value.split(",").map((v: string) => parseFloat(v));
                    if (numbers.some((n: number) => isNaN(n))) {
                        return;
                    }

                    newProp.value = numbers;
                }
                this._editor?.applyCommand(
                    new SetPropertyCommand({
                        selectionSet: this._editor.selectionSet.toArray(),
                        property: newProp,
                    })
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
            ["number-array", () => this._renderInputProperty(property)],
            ["number", () => this._renderInputProperty(property)],
            ["string", () => this._renderInputProperty(property)],
            ["color", () => this._renderColorProperty(property)],
        ]);
    }

    private _addProperty(property: DocumentProperty) {
        const newProp = property.clone();
        this._editor?.applyCommand(
            new SetPropertyCommand({
                selectionSet: this._editor.selectionSet.toArray(),
                property: newProp,
            })
        );
    }

    private _removeProperty(property: DocumentProperty) {
        const newProp = property.clone();
        newProp.value = undefined;
        this._editor?.applyCommand(
            new SetPropertyCommand({
                selectionSet: this._editor.selectionSet.toArray(),
                property: newProp,
            })
        );
    }

    private _createPropertyDropdown(
        icon: string,
        keep: (prop: DocumentProperty) => boolean,
        click: (item: DocumentProperty) => void
    ): TemplateResult {
        // exclude the properties that are already in the object
        const grouped = getPropertiesByGroup(WellKnownPropertiesArray, keep);
        return html` <sl-dropdown hoist>
            <sl-icon-button slot="trigger" name="${icon}"></sl-icon-button>
            <sl-menu> ${this._createAddDropdownAux(grouped, click)} </sl-menu>
        </sl-dropdown>`;
    }

    private _createRemovePropertyDropdown() {
        const all = this._mergedProperties.map((p) => p.name);
        this._removePropertyDropdown = this._createPropertyDropdown(
            "dash-lg",
            (p) => all.includes(p.name),
            (item) => this._removeProperty(item)
        );
    }

    private _createAddPropertyDropdown() {
        // exclude the properties that are already in the object
        const all = this._mergedProperties.map((p) => p.name);
        this._addPropertyDropdown = this._createPropertyDropdown(
            "plus-lg",
            (p) => !all.includes(p.name),
            (item) => this._addProperty(item)
        );
    }

    private _createAddDropdownAux(
        node: TreeNode,
        click: (item: DocumentProperty) => void
    ): TemplateResult {
        return html`${node.children.map(
            (child) =>
                html`<sl-menu-item>
                    ${node.group === "root"
                        ? html`${child.group}<sl-menu slot="submenu"
                                  >${this._createAddDropdownAux(child, click)}</sl-menu
                              >`
                        : html`<sl-menu>${this._createAddDropdownAux(child, click)}</sl-menu>`}
                </sl-menu-item>`
        )}
        ${node.items.map(
            (item) =>
                html`<sl-menu-item .value=${item.displayName!} @click=${() => click(item)}
                    >${item.displayName}</sl-menu-item
                >`
        )}`;
    }

    override render() {
        return html`
            <div class="container">
                <header class="header">
                    <span>Properties</span>
                    <div class="header-controls">
                        ${this._removePropertyDropdown}${this._addPropertyDropdown}
                    </div>
                </header>
                <div class="main">
                    <!-- Main content goes here -->
                    <div class="two-column-grid">
                        ${this._mergedProperties.map(
                            (property) => html`
                                <span class=${classMap({ readonly: property.readonly })}>
                                    ${property.displayName}
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
