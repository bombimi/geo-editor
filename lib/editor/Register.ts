import { DeleteObjectCommand } from "./commands/DeleteObjectCommand";
import { SetPropertyCommand } from "./commands/SetPropertyCommand";
import { registerCommand } from "./CommandFactory";

export function registerCommands(): void {
    registerCommand("DeleteObjectCommand", (args) => {
        return new DeleteObjectCommand(args);
    });
    registerCommand("SetPropertyCommand", (args) => {
        return new SetPropertyCommand(args);
    });
}
