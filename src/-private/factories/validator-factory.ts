import {
  buildRecordValidatorFor,
  type StandardRecordValidator,
} from '@orbit/records';
import type { Dict } from '@orbit/utils';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';

export default {
  create(injections: {
    validators?: Dict<StandardValidator | StandardRecordValidator>;
  }): ValidatorForFn<StandardValidator | StandardRecordValidator> {
    return buildRecordValidatorFor(injections);
  },
};
