import { expect, test } from "vitest";
import { IntegrationHarness } from "../utils/integration";

test("GET /analytics/clicks", async (ctx) => {
  const h = new IntegrationHarness(ctx);
  const { workspace, http } = await h.init();
  const { workspaceId } = workspace;

  const { status, data: clicks } = await http.get<number>({
    path: "/analytics/clicks",
    query: { workspaceId },
  });

  expect(status).toEqual(200);
  expect(clicks).toEqual(expect.any(Number));
  expect(clicks).toBeGreaterThanOrEqual(0);
});
