import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    sl-icon {
        transform: translateX(-50%);
        color: #00fd00;
    }

    span {
        color: var(--sl-color-neutral-900);
        background-color: var(--sl-color-neutral-100);
        padding: 0.3rem;
        border-radius: 0.4em 1em 1em 0.4em;
    }

    :host(.selected) sl-icon {
        color: yellow;
        font-size: 2em;
    }
`;
1;
