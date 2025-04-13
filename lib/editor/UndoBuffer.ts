import { Command } from "./Command";
import { EditorEvent } from "./EditorEvent";

export type UndoBufferEventArgs = {
    undoBuffer: UndoBuffer;
    canUndo: boolean;
    canRedo: boolean;
};

export type UndoBufferCaretChangedEventArgs = UndoBufferEventArgs & {
    caretPosition: number;
};

export type UndoBufferChangedEventArgs = UndoBufferEventArgs & {
    command: Command;
    caretPosition: number;
};

export class UndoBuffer {
    public onCaretChanged = new EditorEvent<UndoBufferCaretChangedEventArgs>();
    public onChanged = new EditorEvent<UndoBufferChangedEventArgs>();

    private _commands: Command[] = [];
    private _caretPosition?: number;

    public get caretPosition(): number | undefined {
        return this._caretPosition;
    }

    public setCaretPosition(value: number | undefined) {
        if (value !== undefined && value >= 0 && value < this._commands.length) {
            this._caretPosition = value;
            this._raiseCaretChangedEvent();
        }
    }

    public toArray(): Command[] {
        return [...this._commands];
    }

    public isEmpty(): boolean {
        return this._commands.length === 0;
    }

    public push(command: Command): void {
        if (this._caretPosition !== undefined && this._caretPosition < this._commands.length - 1) {
            this._commands = this._commands.slice(0, this._caretPosition + 1);
        }
        this._commands.push(command);
        this.setCaretPosition(this._commands.length - 1);
        this.onChanged.raise({
            undoBuffer: this,
            command,
            caretPosition: this._caretPosition!,
            canUndo: this.canGoBack(),
            canRedo: this.canGoForward(),
        });
    }

    public canGoBack(): boolean {
        return this._caretPosition !== undefined && this._caretPosition > 0;
    }

    public canGoForward(): boolean {
        return this._caretPosition !== undefined && this._caretPosition < this._commands.length - 1;
    }

    public back(): Command {
        if (this.isEmpty()) {
            throw new Error("UndoBuffer is empty, cannot go back.");
        }
        if (this._caretPosition === undefined || this._caretPosition <= 0) {
            throw new Error("Caret is not set.");
        }
        return this._moveCaret(-1);
    }

    public forward(): Command {
        if (this.isEmpty()) {
            throw new Error("UndoBuffer is empty, cannot go forward.");
        }
        if (this._caretPosition === undefined || this._caretPosition >= this._commands.length - 1) {
            throw new Error("Caret is at the end, cannot go forward.");
        }

        return this._moveCaret(1);
    }

    private _raiseCaretChangedEvent() {
        if (this._caretPosition === undefined) {
            throw new Error("Caret position is undefined.");
        }
        this.onCaretChanged.raise({
            undoBuffer: this,
            caretPosition: this._caretPosition,
            canUndo: this.canGoBack(),
            canRedo: this.canGoForward(),
        });
    }

    private _moveCaret(delta: number): Command {
        if (this._caretPosition === undefined) {
            throw new Error("Caret position is undefined.");
        }
        this._caretPosition += delta;
        this._raiseCaretChangedEvent();
        return this._commands[this._caretPosition];
    }
}
