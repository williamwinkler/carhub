import { ApiParam } from "@nestjs/swagger";
import { createZodParamDecorator } from "../utils/zod.utils";

export const zParam = createZodParamDecorator(ApiParam, "param");
