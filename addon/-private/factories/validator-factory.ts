import {
  buildRecordValidatorFor,
  StandardRecordValidator
} from '@orbit/records';
import { Dict } from '@orbit/utils';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';

export default {
  create(injections: {
    validators?: Dict<StandardValidator | StandardRecordValidator>;
  }): ValidatorForFn<StandardValidator | StandardRecordValidator> {
    return buildRecordValidatorFor(injections);
  }
};
