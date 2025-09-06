import { ConsoleLogger } from "@nestjs/common";
import { NestLoggerAdapter } from "@repo/logging";
import { Ctx } from "../ctx";

export class CustomLogger extends ConsoleLogger {
  private static core = new NestLoggerAdapter("api", () => ({
    requestId: Ctx.requestId,
    correlationId: Ctx.correlationId,
    userId: Ctx.userId,
  }));

  private isProd = process.env.NODE_ENV === "production";

  log(message: any, context?: string) {
    if (this.isProd) {
      CustomLogger.core.log(message, context);
    } else {
      super.log(message, context);
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (this.isProd) {
      CustomLogger.core.error(message, trace, context);
    } else {
      super.error(message, trace, context);
    }
  }

  warn(message: any, context?: string) {
    if (this.isProd) {
      CustomLogger.core.warn(message, context);
    } else {
      super.warn(message, context);
    }
  }

  debug(message: any, context?: string) {
    if (this.isProd) {
      CustomLogger.core.debug(message, context);
    } else {
      super.debug(message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (this.isProd) {
      CustomLogger.core.verbose(message, context);
    } else {
      super.verbose(message, context);
    }
  }
}
