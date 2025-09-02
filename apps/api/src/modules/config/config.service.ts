// config/config.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { ConfigSchema } from "./config.schema";

@Injectable()
export class ConfigService {
  constructor(private config: NestConfigService<ConfigSchema, true>) {}

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.config.get(key, { infer: true });
  }
}
