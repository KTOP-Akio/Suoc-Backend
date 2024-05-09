import { openApiErrorResponses } from "@/lib/openapi/responses";
import z from "@/lib/zod";
import {
  clickAnalyticsQuerySchema,
  getClickAnalyticsResponse,
} from "@/lib/zod/schemas";
import { ZodOpenApiOperationObject } from "zod-openapi";
import { workspaceParamsSchema } from "../request";

export const getDeviceAnalytics: ZodOpenApiOperationObject = {
  operationId: "getDeviceAnalytics",
  "x-speakeasy-name-override": "devices",
  summary: "Retrieve device analytics",
  deprecated: true,
  description:
    "Retrieve the top devices by number of clicks for a link, a domain, or the authenticated workspace.",
  requestParams: {
    query: workspaceParamsSchema.merge(clickAnalyticsQuerySchema),
  },
  responses: {
    "200": {
      description: "The top devices by number of clicks",
      content: {
        "application/json": {
          schema: z.array(getClickAnalyticsResponse["device"]),
        },
      },
    },
    ...openApiErrorResponses,
  },
  tags: ["Analytics"],
  security: [{ token: [] }],
};
