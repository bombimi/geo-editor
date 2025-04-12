export class EditorEvent<T> {
    private _listeners: Array<(args: T) => void> = [];

    public add(listener: (args: T) => void): void {
        this._listeners.push(listener);
    }

    public remove(listener: (args: T) => void): void {
        this._listeners = this._listeners.filter((l) => l !== listener);
    }

    public raise(args: T): void {
        this._listeners.forEach((listener) => listener(args));
    }
}
