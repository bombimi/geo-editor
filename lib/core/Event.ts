export class Event {
    private _listeners: Array<(args: any) => void> = [];

    public add(listener: (args: any) => void): void {
        this._listeners.push(listener);
    }

    public remove(listener: (args: any) => void): void {
        this._listeners = this._listeners.filter((l) => l !== listener);
    }

    public raise(args: any): void {
        this._listeners.forEach((listener) => listener(args));
    }
}
