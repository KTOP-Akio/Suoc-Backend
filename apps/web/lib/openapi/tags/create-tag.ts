import { ZodOpenApiOperationObject } from "zod-openapi";

import z from "@/lib/zod";
import { CreateTagBodySchema, TagSchema } from "@/lib/zod/schemas/tags";

export const createTag: ZodOpenApiOperationObject = {
  operationId: "createTag",
  summary: "Create a new tag",
  description: "Create a new tag for the authenticated project.",
  requestParams: {
    path: z.object({
      projectSlug: z
        .string()
        .describe(
          "The slug for the project to create tags for. E.g. for `app.dub.co/acme`, the `projectSlug` is `acme`.",
        ),
    }),
  },
  requestBody: {
    content: {
      "application/json": {
        schema: CreateTagBodySchema,
      },
    },
  },
  responses: {
    "201": {
      description: "The created tag",
      content: {
        "application/json": {
          schema: TagSchema
        },
      },
    },
  },
  tags: ["Tags"],
};
