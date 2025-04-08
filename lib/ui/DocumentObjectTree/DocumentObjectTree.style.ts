import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
        background-color: var(--sl-color-neutral-0);
    }

    sl-tree {
        --indent-guide-width: 1px;
    }

    sl-tree-item.selected {
        background-color: var(--sl-color-primary-100);
    }
`;
