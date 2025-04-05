import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-0);
        border: 1px solid var(--sl-color-neutral-500);
        border-radius: 0.5rem;
    }

    ds-property-editor {
        min-height: 20rem;
        background-color: var(--sl-color-neutral-100);
        margin: 1em;
        border-radius: 0.5em;
    }

    ds-document-object-tree {
        height: 100%;
        margin: 1em;
        margin-bottom: 0;
        border-radius: 0.5em;
        overflow: auto;
    }
`;
