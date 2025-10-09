import type Cache from './cache.ts';
import type Model from './model.ts';
import { type RecordIdentity } from '@orbit/records';
export default class ModelFactory {
    #private;
    constructor(cache: Cache);
    create(identity: RecordIdentity): Model;
    private modelFactoryFor;
}
//# sourceMappingURL=model-factory.d.ts.map