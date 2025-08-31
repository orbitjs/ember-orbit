import { EventLoggingStrategy } from '@orbit/coordinator';

const factory = {
  create() {
    return new EventLoggingStrategy();
  },
};

export default factory;
