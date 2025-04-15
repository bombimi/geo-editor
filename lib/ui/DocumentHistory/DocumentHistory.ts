import "@shoelace-style/shoelace/dist/components/icon/icon.js";

import { html } from "lit";
import { customElement, state } from "lit/decorators.js";

import { styles } from "./DocumentHistory.style";
import { EditorElement } from "ui/EditorElement";
import { Command } from "editor/Command";
import { UndoBufferCaretChangedEventArgs, UndoBufferChangedEventArgs } from "editor/UndoBuffer";

import { createHtmlWithHexColors } from "ui-lib/Utils";

@customElement("ds-document-history")
export class DocumentHistory extends EditorElement {
    static override styles = [styles];

    @state() protected _history: Command[] = [];
    @state() protected _caretPosition = 0;

    protected override _editorChanged(): void {
        super._editorChanged();
        this._editorInit();
    }

    private _editorInit() {
        if (this._editor) {
            // Initialize the document history here
            this._editor.undoBuffer.onChanged.add((args: UndoBufferChangedEventArgs) => {
                this._history = args.undoBuffer.toArray();
                this._caretPosition = args.caretPosition;
            });
            this._editor.undoBuffer.onCaretChanged.add((args: UndoBufferCaretChangedEventArgs) => {
                this._caretPosition = args.caretPosition;
            });
        }
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this._editorInit();
    }

    override render() {
        return html`<div class="container">
            ${this._history.map(
                (command, index) =>
                    html`<div
                        class="command ${index === this._caretPosition ? "selected" : ""}"
                        @click=${() => {
                            /*this._editor?.undoBuffer.moveCaret(index) */
                        }}
                    >
                        ${index === this._caretPosition
                            ? html`<sl-icon name="caret-right-fill"></sl-icon>`
                            : ""}
                        <span>${createHtmlWithHexColors(command.description)}</span>
                    </div>`
            )}
        </div>`;
    }
}
