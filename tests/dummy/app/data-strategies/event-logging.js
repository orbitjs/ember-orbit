import { EventLoggingStrategy } from '@orbit/coordinator';
import config from 'dummy/config/environment';

const factory = {
  create() {
    return new EventLoggingStrategy();
  }
};

// Conditionally include this strategy
export default config.environment !== 'production' ? factory : null;
