import { ZodOpenApiPathsObject } from "zod-openapi";

import { createBulkLink } from "./create-bulk-link";
import { createLink } from "./create-link";
import { deleteLink } from "./delete-link";
import { editLink } from "./edit-link";
import { getLinkInfo } from "./get-link-info";
import { getLinks } from "./get-links";
import { getQRCode } from "./get-qr";

export const linksPaths: ZodOpenApiPathsObject = {
  "/links": {
    post: createLink,
    get: getLinks,
  },
  "/links/info": {
    get: getLinkInfo,
  },
  "/links/{linkId}": {
    put: editLink,
    delete: deleteLink,
  },
  "/links/bulk": {
    post: createBulkLink,
  },
  "/qr": {
    get: getQRCode,
  },
};
