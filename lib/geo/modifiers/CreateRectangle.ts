import { Modifier } from "../../editor/Modifier";

export class CreateRectangle extends Modifier {
    public override get name() {
        return "CreateRectangle";
    }

    public override get description() {
        return "Creates a rectangle.";
    }

    public override get icon() {
        return {
            source: "app-icons",
            name: "rectangle",
        };
    }

    constructor() {
        super();
    }
}
