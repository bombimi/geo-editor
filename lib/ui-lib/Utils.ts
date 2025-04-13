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
