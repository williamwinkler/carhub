export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string; // optional, for future extension
}

export class CoreLogger {
  private readonly serviceName: string;

  constructor(serviceName = process.env.SERVICE_NAME || "unknown-service") {
    this.serviceName = serviceName;
  }

  private write(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: string,
    logContext?: LogContext
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      context: context || null,
      message: typeof message === "string" ? message : JSON.stringify(message),
      requestId: logContext?.requestId ?? null,
      correlationId: logContext?.correlationId ?? null,
      userId: logContext?.userId ?? null,
      trace: trace ?? null,
    };

    console.log(JSON.stringify(logEntry));
  }

  log(message: any, context?: string, logContext?: LogContext) {
    this.write("log", message, context, undefined, logContext);
  }
  error(message: any, trace?: string, context?: string, logContext?: LogContext) {
    this.write("error", message, context, trace, logContext);
  }
  warn(message: any, context?: string, logContext?: LogContext) {
    this.write("warn", message, context, undefined, logContext);
  }
  debug(message: any, context?: string, logContext?: LogContext) {
    this.write("debug", message, context, undefined, logContext);
  }
  verbose(message: any, context?: string, logContext?: LogContext) {
    this.write("verbose", message, context, undefined, logContext);
  }
}
