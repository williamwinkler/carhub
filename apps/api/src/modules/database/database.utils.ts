/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryFailedError } from "typeorm";

/**
 * Postgres SQLSTATE error codes you likely care about.
 * Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export enum PgSqlState {
  UniqueViolation = "23505",
  ForeignKeyViolation = "23503",
  CheckViolation = "23514",
  NotNullViolation = "23502",
  SerializationFailure = "40001",
  DeadlockDetected = "40P01",
}

/**
 * Minimal shape of a pg (node-postgres) error. Fields are optional
 * because the driver doesn't guarantee presence for all errors.
 */
export interface PgDriverError extends Error {
  code?: PgSqlState; // SQLSTATE, e.g. '23505'
  detail?: string;
  schema?: string;
  table?: string;
  constraint?: string;
  column?: string;
  routine?: string;
}

/**
 * Type guard: is this a TypeORM QueryFailedError with a pg driver error?
 */
export function isPgQueryFailedError(
  e: unknown,
): e is QueryFailedError & { driverError: PgDriverError } {
  return (
    e instanceof QueryFailedError &&
    typeof (e as any).driverError === "object" &&
    (e as any).driverError !== null
  );
}

/**
 * Extract the SQLSTATE code from a QueryFailedError (if available).
 */
export function getPgCode(e: unknown): PgSqlState | undefined {
  if (!isPgQueryFailedError(e)) {
    return undefined;
  }

  const code = (e.driverError.code ?? "").toString();
  if (Object.values(PgSqlState).includes(code as PgSqlState)) {
    return code as PgSqlState;
  }

  return undefined;
}

/**
 * Extract the constraint name (e.g., 'users_username_key') if any.
 */
export function getPgConstraint(e: unknown): string | undefined {
  if (!isPgQueryFailedError(e)) {
    return undefined;
  }

  return e.driverError.constraint;
}

/**
 * Generic matcher for a given SQLSTATE code, optional constraint name, and table.
 */
export function isPgError(
  e: unknown,
  code: PgSqlState,
  options?: { constraint?: string; table?: string },
): boolean {
  if (!isPgQueryFailedError(e)) {
    return false;
  }

  if (e.driverError.code !== code) {
    return false;
  }

  if (options?.constraint && e.driverError.constraint !== options.constraint) {
    return false;
  }

  if (options?.table && e.driverError.table !== options.table) {
    return false;
  }

  return true;
}

/**
 * Shorthand helpers
 */
export function isUniqueViolation(
  e: unknown,
  opts?: { constraint?: string; table?: string },
): boolean {
  return isPgError(e, PgSqlState.UniqueViolation, opts);
}

export function isForeignKeyViolation(
  e: unknown,
  opts?: { constraint?: string; table?: string },
): boolean {
  return isPgError(e, PgSqlState.ForeignKeyViolation, opts);
}

export function isNotNullViolation(
  e: unknown,
  opts?: { column?: string; table?: string },
): boolean {
  if (!isPgQueryFailedError(e)) {
    return false;
  }

  if (e.driverError.code !== PgSqlState.NotNullViolation) {
    return false;
  }

  if (opts?.table && e.driverError.table !== opts.table) {
    return false;
  }

  // pg doesn’t always provide column, but when it does we can check:
  if (opts?.column && (e.driverError as any).column !== opts.column) {
    return false;
  }

  return true;
}

export function isCheckViolation(
  e: unknown,
  opts?: { constraint?: string; table?: string },
): boolean {
  return isPgError(e, PgSqlState.CheckViolation, opts);
}

export function isSerializationFailure(e: unknown): boolean {
  return isPgError(e, PgSqlState.SerializationFailure);
}

export function isDeadlock(e: unknown): boolean {
  return isPgError(e, PgSqlState.DeadlockDetected);
}

/**
 * Convert known pg errors into your domain/application errors.
 * Supply a mapping table for constraints to error factories.
 */
export type DomainErrorFactory = () => Error;

export interface PgErrorMap {
  unique?: Record<string, DomainErrorFactory>; // by constraint name
  foreignKey?: Record<string, DomainErrorFactory>;
  check?: Record<string, DomainErrorFactory>;
  notNull?: Record<string, DomainErrorFactory>;
}

/**
 * Example translator. You can use this in a catch block to map
 * driver-level errors to your domain errors.
 */
export function translatePgError(e: unknown, map: PgErrorMap): never | void {
  if (!isPgQueryFailedError(e)) {
    return;
  }

  const code = e.driverError.code as PgSqlState | undefined;
  const constraint = e.driverError.constraint;

  if (
    code === PgSqlState.UniqueViolation &&
    constraint &&
    map.unique?.[constraint]
  ) {
    throw map.unique[constraint]();
  }

  if (
    code === PgSqlState.ForeignKeyViolation &&
    constraint &&
    map.foreignKey?.[constraint]
  ) {
    throw map.foreignKey[constraint]();
  }

  if (
    code === PgSqlState.CheckViolation &&
    constraint &&
    map.check?.[constraint]
  ) {
    throw map.check[constraint]();
  }

  if (
    code === PgSqlState.NotNullViolation &&
    constraint &&
    map.notNull?.[constraint]
  ) {
    throw map.notNull[constraint]();
  }
  // If not translated, let the caller rethrow original error.
}
