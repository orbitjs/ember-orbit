import type Model from '../model.ts';
export declare class PropertyCache<T> {
    #private;
    invalidate: number;
    constructor(getter: () => T);
    get value(): T | undefined;
    set value(value: T | undefined);
    notifyPropertyChange(): void;
}
export declare function notifyPropertyChange(record: Model, property: string): void;
export declare function getKeyCache(record: Model, property: string): PropertyCache<unknown>;
export declare function getAttributeCache(record: Model, property: string): PropertyCache<unknown>;
export declare function getHasOneCache(record: Model, property: string): PropertyCache<unknown>;
export declare function getHasManyCache(record: Model, property: string): PropertyCache<unknown>;
//# sourceMappingURL=property-cache.d.ts.map