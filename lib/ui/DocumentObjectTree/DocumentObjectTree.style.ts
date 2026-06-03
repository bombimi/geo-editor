import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
        height: 100%;
        background-color: var(--sl-color-neutral-0);
    }

    .container {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
    }

    sl-tree {
        --indent-guide-width: 1px;
        flex: 1;
        min-height: 0;
        overflow: auto;
    }

    sl-tree-item.selected {
        background-color: var(--sl-color-primary-100);
    }
`;
