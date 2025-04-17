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
            this._history = this._editor.undoBuffer.toArray();
            this._caretPosition = this._editor.undoBuffer.caretPosition ?? 0;

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

    private _moveToCommand(index: number) {
        if (this._editor) {
            const diff = index - this._caretPosition;
            if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                    this._editor.redo();
                }
            }
            if (diff < 0) {
                for (let i = 0; i < -diff; i++) {
                    this._editor.undo();
                }
            }
        }
    }

    override render() {
        return html`<div class="container">
            ${this._history.map(
                (command, index) =>
                    html`<div
                        class="command ${index === this._caretPosition ? "selected" : ""}"
                        @click=${() => this._moveToCommand(index)}
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
