import { NextApiRequest, NextApiResponse } from "next";
import { archiveLink } from "@/lib/api/links";
import { withProjectAuth } from "@/lib/auth";

export default withProjectAuth(
  async (req: NextApiRequest, res: NextApiResponse, _, session) => {
    const { domain, key } = req.query as {
      domain: string;
      key: string;
    };

    if (req.method === "PUT") {
      const response = await archiveLink(domain, key);
      return res.status(200).json(response);
    } else {
      res.setHeader("Allow", ["PUT"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} Not Allowed` });
    }
  },
  {
    needVerifiedDomain: true,
  },
);
