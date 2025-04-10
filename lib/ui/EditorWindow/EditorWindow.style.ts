import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
    }

    .editor-window {
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-100);
    }

    ds-document-renderer {
        width: 100%;
        display: block;
        height: 100%;
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

    .top-left-controls {
        position: absolute;
        left: 1em;
        top: 1em;
    }

    .top-right-controls {
        position: absolute;
        display: flex;
        gap: 0.5em;
        right: 1em;
        top: 1em;
    }

    .side-right-controls {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        right: 1em;
        top: 50%;
        transform: translateY(-50%);
    }

    .status-bar {
        position: absolute;
        display: flex;
        gap: 0.5em;
        bottom: 0em;
        width: 100%;
        left: 0em;
        padding: 1em;
        background-color: var(--sl-color-neutral-200);
    }

    .status-bar-item span {
        color: var(--sl-color-neutral-100);
    }

    sl-icon-button {
        font-size: 2rem;
        border: 1px solid var(--sl-color-neutral-400);
        background-color: var(--sl-color-neutral-0);
    }

    .left-panels {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        left: 1em;
        top: 5em;
        bottom: 6em;
        width: 20em;
        background-color: var(--sl-color-neutral-200);
        border-radius: 0.5em;
    }

    ds-document-editor {
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-200);
    }

    sl-tab-group {
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-0);
    }

    sl-tab-group::part(base) {
        height: 100%;
    }

    sl-tab-group::part(body) {
        height: 100%;
        width: 100%;
        overflow-y: hidden;
        overflow-x: hidden;
    }

    sl-tab-panel {
        height: 100%;
        width: 100%;
    }

    sl-tab-panel::part(base) {
        height: 100%;
        width: 100%;
        --padding: 0em;
    }
`;
