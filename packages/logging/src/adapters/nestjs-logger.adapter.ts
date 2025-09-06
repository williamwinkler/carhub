import { LoggerService } from "@nestjs/common";
import { CoreLogger, LogContext } from "../core-logger";

export class NestLoggerAdapter extends CoreLogger implements LoggerService {
  constructor(
    serviceName: string,
    private readonly contextProvider: () => Required<
      Pick<LogContext, "requestId" | "correlationId">
    > &
      LogContext,
  ) {
    super(serviceName);
  }

  private withContext(extra?: LogContext): LogContext {
    return { ...this.contextProvider(), ...extra };
  }

  log(message: any, context?: string) {
    super.log(message, context, this.withContext());
  }
  error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context, this.withContext());
  }
  warn(message: any, context?: string) {
    super.log(message, context, this.withContext());
  }
  debug(message: any, context?: string) {
    super.debug(message, context, this.withContext());
  }
}
