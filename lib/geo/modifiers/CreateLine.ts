import { Modifier } from "../../editor/Modifier";

export class CreateLine extends Modifier {
    public override get name() {
        return "CreateLine";
    }

    public override get description() {
        return "Creates a line.";
    }

    public override get icon() {
        return {
            source: "app-icons",
            name: "line",
        };
    }

    constructor() {
        super();
    }
}
