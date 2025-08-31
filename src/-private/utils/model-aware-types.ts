import type { QueryOrExpressions, TransformOrOperations } from '@orbit/data';
import {
  type RecordIdentity,
  type RecordKeyValue,
  type RecordOperation,
  RecordQueryBuilder,
  type RecordQueryExpression,
  RecordTransformBuilder,
  type UninitializedRecord,
} from '@orbit/records';
import { Model } from '../../index.ts';
import type { ModelFields } from './model-fields';

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
