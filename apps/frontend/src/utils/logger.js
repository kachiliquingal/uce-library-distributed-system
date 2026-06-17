import log from 'loglevel';

// Establish default enterprise levels
const currentEnv = import.meta.env.MODE || 'development';

// We default to 'info' in all environments so HTTP interceptors are visible in the console.
log.setLevel(currentEnv === 'production' ? 'info' : 'debug');

// PERFECT ENGINEERING: Expose logger to the window object for runtime debugging in Production
if (typeof window !== 'undefined') {
  window.appLogger = log;
}

// Enhance logger with prefixes for better visibility in DevTools
const originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return function (...message) {
    const prefix = `[${methodName.toUpperCase()}] [Frontend]`;
    rawMethod(prefix, ...message);
  };
};

// Apply the new method factory
log.rebuild();

export default log;
