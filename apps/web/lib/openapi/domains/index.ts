import { ZodOpenApiPathsObject } from "zod-openapi";
import { addDomain } from "./add-domain";
import { deleteDomain } from "./delete-domain";
import { editDomain } from "./edit-domain";
import { listDomains } from "./list-domains";
import { setPrimaryDomain } from "./set-primary-domain";
import { transferDomain } from "./transfer-domain";

export const domainsPaths: ZodOpenApiPathsObject = {
  "/domains": {
    post: addDomain,
    get: listDomains,
  },
  "/domains/{slug}": {
    patch: editDomain,
    delete: deleteDomain,
  },
  "/domains/{slug}/primary": {
    post: setPrimaryDomain,
  },
  "/domains/{slug}/transfer": {
    post: transferDomain,
  },
};
