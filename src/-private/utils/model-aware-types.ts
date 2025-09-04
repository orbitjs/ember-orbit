import { Model } from '../../index.ts';
import type { ModelFields } from './model-fields';
import type { QueryOrExpressions, TransformOrOperations } from '@orbit/data';
import {
  RecordQueryBuilder,
  RecordTransformBuilder,
  type RecordIdentity,
  type RecordKeyValue,
  type RecordOperation,
  type RecordQueryExpression,
  type UninitializedRecord,
} from '@orbit/records';

export type RecordIdentityOrModel = RecordIdentity | RecordKeyValue | Model;

export type RecordFieldsOrModel = UninitializedRecord | Model | ModelFields;

export class ModelAwareTransformBuilder extends RecordTransformBuilder<
  string,
  RecordIdentityOrModel,
  RecordFieldsOrModel
> {}

export class ModelAwareQueryBuilder extends RecordQueryBuilder<
  string,
  RecordIdentityOrModel
> {}

export type ModelAwareQueryOrExpressions = QueryOrExpressions<
  RecordQueryExpression,
  ModelAwareQueryBuilder
>;

export type ModelAwareTransformOrOperations = TransformOrOperations<
  RecordOperation,
  ModelAwareTransformBuilder
>;
