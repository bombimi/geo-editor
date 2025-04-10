export type ModifierIcon = {
    name: string;
    source: string;
};

export abstract class Modifier {
    public get enabled(): boolean {
        return true;
    }
    public abstract get name(): string;
    public abstract get icon(): ModifierIcon;
    public abstract get description(): string;
}
