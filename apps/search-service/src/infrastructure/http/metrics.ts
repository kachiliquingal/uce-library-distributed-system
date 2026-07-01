import client from 'prom-client';

// Collect default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({ prefix: 'uce_search_' });

// Custom histogram for HTTP request durations
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'uce_search_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware to track request duration
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      code: res.statusCode
    });
  });
  next();
};

export { client as metricsClient };
