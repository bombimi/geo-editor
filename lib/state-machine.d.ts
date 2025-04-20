declare module "state-machine/dist/state-machine.js" {
    export namespace StateMachine {
        interface Transition {
            action: string;
            from: string;
            to: string;
        }

        interface Handlers {
            [state: string]: (...args: any[]) => void;
        }

        interface Config {
            transitions: string[] | Transition[];
            handlers: Handlers;
        }

        class StateMachine {
            constructor(config: Config);
            do(event: string, ...args: any[]): boolean;
            go(state: string, force = false): boolean;
        }
    }

    export = StateMachine;
}
