import { HttpStatus } from "@nestjs/common";

export type ErrorDef = {
  status: HttpStatus;
  message: string;
};

export const Errors = {
  // General errors
  UNEXPECTED_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "An unexpected error occurred",
  },
  VALIDATION_ERROR: {
    status: HttpStatus.BAD_REQUEST,
    message: "Validation failed",
  },
  INVALID_CREDENTIALS: {
    status: HttpStatus.UNAUTHORIZED,
    message: "Invalid credentials",
  },
  INVALID_REFRESH_TOKEN: {
    status: HttpStatus.UNAUTHORIZED,
    message: "Missing or invalid refresh token",
  },
  TOO_MANY_REQUESTS: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: "Too many requests, try again later",
  },
  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    message: "You need to be authorized to perform this action",
  },
  FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: "You don't have permission to perform this action",
  },

  // Car errors
  CAR_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: "Car not found",
  },

  // Car Model errors
  CAR_MODEL_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message:
      "Car model already exists. Ensure the model name is new and unqiue",
  },
  CAR_MODEL_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: "Car model not found",
  },

  // Car manufacturer errors
  CAR_MANUFACTURER_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: "Car manufacturer already exists",
  },
  CAR_MANUFACTURER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: "Car manufacturer not found",
  },

  // User errors
  USER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: "User not found",
  },
  ONLY_ADMINS_CAN_UPDATE_ROLES: {
    status: HttpStatus.FORBIDDEN,
    message: "Only admins can update roles",
  },
  USERS_CAN_ONLY_UPDATE_OWN_CARS: {
    status: HttpStatus.FORBIDDEN,
    message: "Users can only update their own cars",
  },
  USERNAME_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: "Username already exists",
  },

  /* eslint-enable prettier/prettier */
} as const satisfies Readonly<Record<string, ErrorDef>>;

export type ErrorKey = keyof typeof Errors;
export type ErrorEntry = (typeof Errors)[ErrorKey];

// Reverse map entry -> key so we can auto-fill errorCode
export const EntryToKey = new Map<ErrorEntry, ErrorKey>(
  Object.entries(Errors).map(([k, v]) => [v, k as ErrorKey]),
);
