import type { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import { EntryToKey, type ErrorEntry, type ErrorKey } from "./errors";

type AppErrorBody = {
  statusCode: HttpStatus;
  errorCode: ErrorKey;
  message: string;
  errors?: unknown; // e.g., zod issues if you pass them in meta
  id: string;
};

export class AppError<E extends ErrorEntry = ErrorEntry> extends HttpException {
  readonly code: ErrorKey; // registry key
  readonly id: string;
  readonly meta?: unknown;

  constructor(
    entry: E,
    opts?: { message?: string; meta?: unknown; cause?: unknown },
  ) {
    const status = entry.status;
    const code = EntryToKey.get(entry)!; // assume entries come from Errors
    const id = crypto.randomUUID();

    const body: AppErrorBody = {
      statusCode: status,
      errorCode: code,
      message: opts?.message ?? entry.message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors: (opts?.meta as any)?.issues,
      id,
    };

    super(body, status, { cause: opts?.cause });

    // augment after super
    this.code = code;
    this.id = id;
    this.meta = opts?.meta;
    this.name = this.name; // see explanation below

    // keeps stack clean
    Error.captureStackTrace?.(this, AppError);
  }
}
