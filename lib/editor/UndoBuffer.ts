import { Command } from "./Command";

export class UndoBuffer {
    private _commands: Command[] = [];
    private _caret = 0;

    public isEmpty(): boolean {
        return this._commands.length === 0;
    }

    public push(command: Command): void {
        this._commands.push(command);
        this._caret = this._commands.length;
    }

    public canGoBack(): boolean {
        return this._caret > 0;
    }

    public canGoForward(): boolean {
        return this._caret < this._commands.length;
    }

    public back(): Command | undefined {
        console.assert(!this.isEmpty(), "UndoBuffer is empty, cannot go back.");
        console.assert(this._caret > 0, "Caret is at the beginning, cannot go back.");
        return this._commands[--this._caret];
    }

    public forward(): Command | undefined {
        console.assert(!this.isEmpty(), "UndoBuffer is empty, cannot go back.");
        console.assert(
            this._caret < this._commands.length,
            "Caret is at the end, cannot go forward."
        );

        if (this._caret < this._commands.length) {
            return this._commands[++this._caret];
        }
        return undefined;
    }
}
