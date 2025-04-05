import { Modifier } from "../../core/Modifier";

export class CreateCircle extends Modifier {
    public override get name() {
        return "CreateCircle";
    }

    public override get description() {
        return "Creates a circle.";
    }

    public override get icon() {
        return {
            source: "default",
            name: "circle",
        };
    }

    constructor() {
        super();
    }
}
