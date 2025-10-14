import type { AttributeDefinition, KeyDefinition, ModelDefinition, RelationshipDefinition } from '@orbit/records';
export declare function getModelDefinition(proto: any): ModelDefinition;
export declare function extendModelDefinition(proto: any, modelDefinition: ModelDefinition): void;
export declare function defineAttribute(proto: object, name: string, options: AttributeDefinition): void;
export declare function defineKey(proto: object, name: string, options: KeyDefinition): void;
export declare function defineRelationship(proto: object, name: string, options: RelationshipDefinition): void;
//# sourceMappingURL=model-definition.d.ts.map