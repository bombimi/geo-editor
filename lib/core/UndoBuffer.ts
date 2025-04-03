import { Command } from "./Command";

export class UndoBuffer {
    private _commands: Command[] = [];

    push(command: Command): void {
        this._commands.push(command);
    }

    pop(): Command | undefined {
        return this._commands.pop();
    }
}
