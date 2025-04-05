import { Modifier } from "../../core/Modifier";

export class CreatePoint extends Modifier {
    public override get name() {
        return "CreatePoint";
    }

    public override get description() {
        return "Creates a point.";
    }

    public override get icon() {
        return {
            source: "default",
            name: "geo-alt",
        };
    }

    constructor() {
        super();
    }
}
