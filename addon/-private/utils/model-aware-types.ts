import { QueryOrExpressions, TransformOrOperations } from '@orbit/data';
import {
  RecordIdentity,
  RecordKeyValue,
  RecordOperation,
  RecordQueryBuilder,
  RecordQueryExpression,
  RecordTransformBuilder,
  UninitializedRecord
} from '@orbit/records';
import { Model } from 'ember-orbit';
import { ModelFields } from './model-fields';

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
