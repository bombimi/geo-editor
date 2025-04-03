import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
    }

    .editor-window {
        background-color: var(--sl-color-neutral-100);
    }

    .no-document-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .no-document-inner {
        display: flex;
        flex-direction: column;
    }

    .no-document-text {
        font-size: 5rem;
        font-weight: bold;
        color: var(--sl-color-neutral-400);
    }

    .no-document-tagline {
        font-size: 2rem;
        font-style: italic;
        align-self: end;
        text-decoration: none;
        color: var(--sl-color-neutral-500);
    }

    .document-renderer {
        width: 100%;
        height: 100%;
    }
`;
