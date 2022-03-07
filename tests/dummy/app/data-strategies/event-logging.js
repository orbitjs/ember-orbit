import { EventLoggingStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new EventLoggingStrategy();
  }
};
