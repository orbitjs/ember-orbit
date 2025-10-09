import { Coordinator, type CoordinatorOptions } from '@orbit/coordinator';
export type CoordinatorInjections = {
    sourceNames?: string[];
    strategyNames?: string[];
} & CoordinatorOptions;
declare const _default: {
    create(injections?: CoordinatorInjections): Coordinator;
};
export default _default;
//# sourceMappingURL=data-coordinator.d.ts.map