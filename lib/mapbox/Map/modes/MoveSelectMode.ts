import { featureCollection } from "@turf/helpers";
import { SelectionSet } from "editor/SelectionSet";
import { GeoDocument } from "geo/GeoDocument";
import { GeoObject } from "geo/GeoObject";
import { Factory } from "geo/objects/Factory";
import { debounce } from "lodash-es";
import { LngLat, MapMouseEvent, Point } from "maplibre-gl";
import { GeoJsonSource } from "../GeoJsonSource";
import { MapboxMap } from "../MapboxMap";
import { SelectMode } from "./SelectMode";

export class MoveSelectMode extends SelectMode {
    public override displayName = "Move features";
    public override name = "move";
    public override description = "Move features on the map.";
    public override cursor = "cursor";
    public override showEditLayer = true;
    public override showGeoLayer = true;

    protected _dirty = true;
    private _moving = false;
    private _dragging = false;
    private _dragDecided = false;
    private _clickedFeature = "";
    private _clickedFeatureWasInSelectionSet = false;
    private _append = false;
    private _moveStartPoint = new Point(0, 0);
    private _lastLngLat?: LngLat;
    private _mouseMoveDebounced = debounce(this._mouseMove.bind(this), 1);
    protected _editDoc: GeoDocument = new GeoDocument();
    protected _editDelta = new LngLat(0, 0);

    constructor(
        map: MapboxMap,
        geoSource: GeoJsonSource,
        featureSource: GeoJsonSource
    ) {
        super(map, geoSource, featureSource);
    }

    protected _markDirty() {
        this._dirty = true;
    }

    protected _reset() {
        this._geoSource.clear();
        this._editDelta = new LngLat(0, 0);
        this._editDoc = new GeoDocument();
    }

    public override onDeactivate(): void {
        super.onDeactivate();
        this._reset();
    }

    public override onSelectionSetChanged(selectionSet: string[]): void {
        super.onSelectionSetChanged(selectionSet);
        const toRemove = new Set<string>();
        this._editDoc.children.forEach((x) => toRemove.add(x.guid));

        const features = selectionSet
            .map((x) => this._featureSource.featureFromGuid(x))
            .filter((x) => x !== undefined);
        features.forEach((x) => {
            const guid = (x.properties as any).__meta_guid;
            if (!this._editDoc.getChild(guid)) {
                // add the feature
                this._editDoc.addChild(Factory.createFeature(x, guid));
            } else {
                // ignore existing
                toRemove.delete(guid);
            }
        });

        // remove unselected objects
        for (const item of toRemove) {
            this._editDoc.removeChild(item);
        }
        this._markDirty();
    }

    public override onClick(_e: MapMouseEvent): void {
        // we don't want the default on click behaviour
    }

    public override onMouseDown(e: MapMouseEvent): void {
        const feature = this._featureSource.featureAtScreenLocation(e.point);

        if (feature) {
            const guid = feature.properties!.__meta_guid;

            this._append = e.originalEvent.ctrlKey;

            this._map.mapboxGL!.dragPan.disable();
            this._map.mapboxGL!.dragRotate.disable();

            this._moving = true;
            this._dragging = false;
            this._dragDecided = false;
            this._moveStartPoint = e.point.clone();
            this._lastLngLat = e.lngLat;
            this._clickedFeature = guid;
            this._clickedFeatureWasInSelectionSet =
                this._selectionSet.contains(guid);

            // If not appending and the clicked feature is not already part of
            // the current selection, immediately narrow the selection to just
            // this feature so that only it drags (not the previous selection).
            if (!this._append && !this._clickedFeatureWasInSelectionSet) {
                this._selectionSet = new SelectionSet([guid]);
                this.onSelectionSetChanged(this._selectionSet.toArray());
                this._raiseSelectionSetChangedEvent();
            }
        }
    }

    protected _isDragging(point: Point): boolean {
        // we only remove features from the selection set if we have not moved a
        // certain amount of pixels other we interpret it as a drag
        const dx = point.x - this._moveStartPoint.x;
        const dy = point.y - this._moveStartPoint.y;
        const distMoved = Math.sqrt(dx * dx + dy * dy);
        return distMoved > 8;
    }

    public override onMouseUp(e: MapMouseEvent): void {
        if (this._moving) {
            if (this._isDragging(e.point)) {
                // commit to the move
                if (this._editDelta.lng !== 0 || this._editDelta.lat !== 0) {
                    this._map._dispatchEvent("move-feature", {
                        selectionSet: this._selectionSet.toArray(),
                        lon: this._editDelta.lng,
                        lat: this._editDelta.lat,
                    });
                }
            } else {
                // is a click so update the selection set
                if (this._append) {
                    if (this._selectionSet.contains(this._clickedFeature)) {
                        this._selectionSet.remove(this._clickedFeature);
                    } else {
                        this._selectionSet.add(this._clickedFeature);
                    }
                } else {
                    this._selectionSet = new SelectionSet([
                        this._clickedFeature,
                    ]);
                }
                this._raiseSelectionSetChangedEvent();
            }

            this._editDelta = new LngLat(0, 0);
            this._moving = false;
            this._map.mapboxGL!.dragPan.enable();
            this._map.mapboxGL!.dragRotate.enable();
            this._markDirty();
        }
    }

    public override onMouseMove(e: MapMouseEvent): void {
        super.onMouseMove(e);
        this._mouseMoveDebounced(e);
    }

    private _mouseMove(e: MapMouseEvent): void {
        if (this._moving) {
            if (this._lastLngLat) {
                const deltaLat = e.lngLat.lat - this._lastLngLat!.lat;
                const deltaLon = e.lngLat.lng - this._lastLngLat!.lng;

                this._editDelta.lng += deltaLon;
                this._editDelta.lat += deltaLat;

                if (this._isDragging(e.point)) {
                    if (!this._dragDecided) {
                        // make sure the point is in the selection set
                        if (
                            !this._selectionSet.contains(this._clickedFeature)
                        ) {
                            this._selectionSet.add(this._clickedFeature);
                            this._raiseSelectionSetChangedEvent();
                        }
                        this._dragDecided = true;
                    }

                    this._editDoc.children
                        .map((x) => x as GeoObject)
                        .forEach((x) => x.move(deltaLat, deltaLon));

                    this._markDirty();
                }
                this._lastLngLat = e.lngLat;
            }

            e.preventDefault();
        } else {
            super.onMouseMove(e);
        }
    }

    public override render() {
        if (!this._dirty) {
            return;
        }

        if (!this._moving) {
            this._geoSource.clear();
        } else {
            const collection = featureCollection(
                this._editDoc.geoJson?.features.features
            );
            this._geoSource.update(collection);
        }

        this._dirty = false;
    }
}
