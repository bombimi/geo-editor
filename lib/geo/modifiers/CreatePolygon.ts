import { Modifier } from "../../editor/Modifier";

export class CreatePolygon extends Modifier {
    public override get name() {
        return "CreatePolygon";
    }

    public override get description() {
        return "Creates a polygon.";
    }

    public override get icon() {
        return {
            source: "app-icons",
            name: "polygon",
        };
    }

    constructor() {
        super();
    }
}
