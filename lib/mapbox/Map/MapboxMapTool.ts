export abstract class MapboxMapTool {
    public abstract get name(): string;
    public abstract get description(): string;
    public abstract get type(): string;

    constructor() {}

    public mapSelected(): void {
        // Implement the logic to handle map selection
    }

    public objectSelected(): void {
        // Implement the logic to handle object selection
    }
}
