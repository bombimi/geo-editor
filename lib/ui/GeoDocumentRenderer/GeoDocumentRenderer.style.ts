import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }

    .container {
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-100);
    }
`;
