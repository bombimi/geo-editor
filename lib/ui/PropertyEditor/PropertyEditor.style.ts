import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
        background-color: var(--sl-color-neutral-0);
        color: var(--sl-color-neutral-900);
    }

    .container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .main {
        flex: 1;
        overflow: auto;
        padding: var(--ds-padding);
    }

    .header {
        flex-shrink: 0;
        padding: 0.5rem;
        padding-left: 1rem;
        color: var(--ds-panel-color);
        background-color: var(--ds-panel-background-color);
        flex-direction: row;
        display: flex;
        justify-content: space-between;
    }

    .header-controls {
        display: flex;
        gap: 0.5rem;
    }

    .footer {
        flex-shrink: 0;
        background: #f1f1f1;
        padding: 1rem;
        text-align: center;
        color: var(--ds-panel-color);
        background-color: var(--ds-panel-background-color);
    }

    .two-column-grid {
        width: 100%;
        display: grid;
        grid-template-columns: 30% auto;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
    }

    sl-input {
        min-width: 0;
    }

    .readonly {
        font-style: italic;
    }

    .color-property {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        overflow-x: hidden;
        width: 100%;
    }
`;
