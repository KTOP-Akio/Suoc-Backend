import { VALID_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import z from "@/lib/zod";
import { leadAnalyticsResponse } from "@/lib/zod/schemas/leads-analytics";
import { describe, expect, test } from "vitest";
import { IntegrationHarness } from "../utils/integration";
import { filter } from "./utils";

describe.skip.sequential("GET /analytics/leads", async () => {
  const h = new IntegrationHarness();
  const { workspace, http } = await h.init();
  const { workspaceId } = workspace;

  VALID_ANALYTICS_ENDPOINTS.map((endpoint) => {
    test(`by ${endpoint}`, async () => {
      const { status, data } = await http.get<any[]>({
        path: `/analytics/leads/${endpoint}`,
        query: { workspaceId, ...filter },
      });

      if (endpoint === "count") {
        expect(status).toEqual(200);
        expect(data).toEqual(expect.any(Number));
        expect(data).toBeGreaterThanOrEqual(0);
        return;
      }

      const parsed = z
        .array(leadAnalyticsResponse[endpoint].strict())
        .safeParse(data);

      expect(status).toEqual(200);
      expect(data.length).toBeGreaterThanOrEqual(0);
      expect(parsed.success).toBeTruthy();
    });
  });
});
