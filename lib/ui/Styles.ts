import { css } from "lit";

export const Style = css`
    * {
        font-family: var(--sl-font-sans);

        --ds-background-color: var(--sl-color-neutral-0);
        --ds-color: var(--sl-color-neutral-900);
        --ds-padding: 0.5rem;
        --ds-panel-background-color: var(--sl-color-neutral-50);
        --ds-panel-color: var(--sl-color-neutral-700);
    }

    html {
        box-sizing: border-box;
    }
    *,
    *:before,
    *:after {
        box-sizing: inherit;
    }
`;
