import type { BinaryToTextEncoding } from "crypto";
import { createHash } from "crypto";

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function hash(
  value: string,
  algorithm = "sha256",
  digest: BinaryToTextEncoding = "hex",
): string {
  return createHash(algorithm).update(value).digest(digest);
}
