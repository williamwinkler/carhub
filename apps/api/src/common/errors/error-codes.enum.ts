export enum ErrorCode {
  GENERAL_ERROR = 1000,
  UNKNOWN = 1001,

  // Validation
  VALIDATION_ERROR = 1100,
  INVALID_ENUM = 1101,

  // Not Found
  NOT_FOUND = 2000,
  CAR_NOT_FOUND = 2001,

  // Auth
  UNAUTHORIZED = 3000,
  FORBIDDEN = 3001,

  // Conflict
  CONFLICT = 4000,

}
