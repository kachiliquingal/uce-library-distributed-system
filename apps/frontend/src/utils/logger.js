import log from 'loglevel';

// Set default level based on environment
const currentEnv = import.meta.env.MODE || 'development';

if (currentEnv === 'production') {
  log.setLevel('warn'); // Only show warn and error in Prod
} else {
  log.setLevel('debug'); // Show everything in Dev
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
