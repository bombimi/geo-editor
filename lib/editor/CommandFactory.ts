import { Command } from "./Command";

export type SavedCommand = {
    type: string;
    payload: any;
};

export type CommandFactoryFunction = (args: any) => Command;

const factory = new Map<string, CommandFactoryFunction>();

export function registerCommand(name: string, factoryFunc: CommandFactoryFunction): void {
    factory.set(name, factoryFunc);
}

export function saveCommand(command: Command): SavedCommand {
    return {
        type: command.name,
        payload: command.serialize(),
    };
}

export function createCommand(saved: SavedCommand): Command {
    const factoryFunc = factory.get(saved.type);
    if (factoryFunc) {
        return factoryFunc(saved.payload);
    }
    throw new Error("Unknown command type: " + saved.type);
}
