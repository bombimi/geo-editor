import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
    }

    .container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .main {
        flex: 1;
        overflow: auto;
    }

    .footer {
        flex-shrink: 0;
        background: #f1f1f1;
        padding: 1rem;
        text-align: center;
        color: var(--sl-color-neutral-700);
        background-color: var(--sl-color-neutral-0);
    }
`;
