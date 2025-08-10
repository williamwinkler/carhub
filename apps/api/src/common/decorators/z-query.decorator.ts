import { ApiQuery } from "@nestjs/swagger";
import { createZodParamDecorator } from "../utils/zod.utils";

export const zQuery = createZodParamDecorator(ApiQuery, "query");
