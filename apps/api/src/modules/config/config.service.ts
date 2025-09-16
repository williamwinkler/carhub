// config/config.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { ConfigSchema } from "./config.schema";

@Injectable()
export class ConfigService {
  constructor(private config: NestConfigService<ConfigSchema, true>) {}

  // Overload signatures
  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K];
  get<K extends keyof ConfigSchema>(
    key: K,
    defaultValue: ConfigSchema[K],
  ): ConfigSchema[K];

  // Implementation
  get<K extends keyof ConfigSchema>(
    key: K,
    defaultValue?: ConfigSchema[K],
  ): ConfigSchema[K] {
    return (
      this.config.get(key, {
        infer: true,
      }) ?? (defaultValue as ConfigSchema[K])
    );
  }
}
