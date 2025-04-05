import type { LitElement } from "lit";
type UpdateHandler = (prev?: unknown, next?: unknown) => void;
type NonUndefined<A> = A extends undefined ? never : A;
type UpdateHandlerFunctionKeys<T extends object> = {
    [K in keyof T]-?: NonUndefined<T[K]> extends UpdateHandler ? K : never;
}[keyof T];

interface WatchOptions {
    waitUntilFirstUpdate?: boolean;
}

export function watch(
    propertyName: string | string[],
    options?: WatchOptions
): <ElemClass extends LitElement>(
    proto: ElemClass,
    decoratedFnName: UpdateHandlerFunctionKeys<ElemClass>
) => void {
    const resolvedOptions = Object.assign({ waitUntilFirstUpdate: false }, options);
    return (proto: any, decoratedFnName: any) => {
        const { update } = proto;
        const watchedProperties = Array.isArray(propertyName) ? propertyName : [propertyName];
        proto.update = function (changedProps: any) {
            watchedProperties.forEach((property) => {
                const key = property;
                if (changedProps.has(key)) {
                    const oldValue = changedProps.get(key);
                    const newValue = this[key];
                    if (oldValue !== newValue) {
                        if (!resolvedOptions.waitUntilFirstUpdate || this.hasUpdated) {
                            this[decoratedFnName](oldValue, newValue);
                        }
                    }
                }
            });
            update.call(this, changedProps);
        };
    };
}
