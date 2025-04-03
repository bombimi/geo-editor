import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
    }

    .container {
        background-color: var(--sl-color-neutral-900);
    }
`;
