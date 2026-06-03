import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
        background-color: var(--sl-color-neutral-0);
        border: 1px solid var(--sl-color-neutral-500);
        border-radius: 0.5rem;
    }

    sl-split-panel {
        height: 100%;
        min-height: 0;
        --divider-width: 20px;
    }

    ds-property-editor {
        min-height: 0;
        height: 100%;
        border-radius: 0.5em;
        overflow: hidden;
    }

    ds-document-object-tree {
        height: 100%;
        min-height: 0;
        margin-bottom: 0;
        border-radius: 0.5em;
        overflow: auto;
    }
`;
