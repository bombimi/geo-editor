import "@shoelace-style/shoelace/dist/components/alert/alert.js";

import { TemplateResult, html } from "lit";

export function createCustomEvent(name: string, details: any) {
    return new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail: details,
    });
}

/**
 * Converts a camelCase string to a human-readable format.
 * Adds spaces between words and capitalizes the initial character.
 *
 * @param input - The camelCase string to convert.
 * @returns The formatted string.
 */
export function camelCaseToReadable(input: string): string {
    let res = "";
    for (let i = 0; i < input.length; ++i) {
        const ch = input[i];
        if (i === 0) {
            res += ch;
        } else if (ch >= "A" && ch <= "Z") {
            res += " " + ch.toLowerCase();
        } else {
            res += ch;
        }
    }
    return res;
}

/**
 * Take a string and return HTML with hex colors highlighted.
 *
 * @param text - The text to be parsed for hex colors.
 * @returns Lit HTML TemplateResult with hex colors highlighted.
 */
export function createHtmlWithHexColors(text: string): TemplateResult {
    const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
    const parts = text.split(hexColorRegex);

    return html`${parts.map((part, index) => {
        if (index % 2 === 1) {
            const color = `#${part}`;
            return html`${color}
                <span
                    style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; margin-left: 4px; border: 1px solid #000;"
                ></span>`;
        }
        return part;
    })}`;
}

// Always escape HTML for text arguments!
function escapeHtml(html: string) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
}

export function showToast(
    message: string,
    variant = "primary",
    icon = "info-circle",
    duration = 3000
) {
    const alert = Object.assign(document.createElement("sl-alert"), {
        variant,
        closable: true,
        duration: duration,
        innerHTML: `
        <sl-icon name="${icon}" slot="icon"></sl-icon>
        ${escapeHtml(message)}
      `,
    }) as any;

    document.body.append(alert);
    return alert.toast();
}
