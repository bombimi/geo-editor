import { DocumentProvider } from "./DocumentProvider";
import { Modifier } from "./Modifier";

export abstract class EditorProvider {
    public abstract get documentProviders(): DocumentProvider[];
    public abstract get modifiers(): Modifier[];
}
