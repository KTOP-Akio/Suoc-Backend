import { NextApiRequest, NextApiResponse } from "next";
import { withProjectAuth } from "@/lib/auth";
import { ProjectProps } from "@/lib/types";
import { getLinksCount } from "@/lib/api/links";

export default withProjectAuth(
  async (req: NextApiRequest, res: NextApiResponse, project: ProjectProps) => {
    // GET /api/projects/[slug]/domains/[domain]/links/count – count the number of links for a project
    if (req.method === "GET") {
      const count = await getLinksCount({
        req,
        projectId: project.id,
      });
      return res.status(200).json(count);
    } else {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }
  },
);
