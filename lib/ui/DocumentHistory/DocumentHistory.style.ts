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
        width: 100%;
        padding: var(--ds-padding);
    }

    .command {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: var(--ds-padding);
        border-bottom: 1px solid var(--sl-color-neutral-200);
        cursor: pointer;
    }

    .selected {
        background-color: var(--sl-color-primary-100);
    }
    sl-icon {
        padding-right: var(--ds-padding);
    }
`;
