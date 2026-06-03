import { css } from "lit";
import { Style } from "../Styles";

export const styles = css`
    ${Style}
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }

    .container {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: var(--sl-color-neutral-100);
    }

    #stars,
    #stars2,
    #stars3 {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
    }

    ds-map {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        height: 100%;
    }
`;
