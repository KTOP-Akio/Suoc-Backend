import { punyEncode } from "@dub/utils";
import {
  decodeLinkIfCaseSensitive,
  encodeKeyIfCaseSensitive,
} from "../api/case-sensitive-short-links";
import { conn } from "./connection";
import { EdgeLinkProps } from "./types";

export const getLinkViaEdge = async ({
  domain,
  key,
}: {
  domain: string;
  key: string;
}) => {
  const keyToQuery = encodeKeyIfCaseSensitive({
    domain,
    key,
  });

  const { rows } =
    (await conn.execute(
      "SELECT * FROM Link WHERE domain = ? AND `key` = ?",
      [domain, punyEncode(decodeURIComponent(keyToQuery))], // we need to make sure that the key is always URI-decoded + punycode-encoded (cause that's how we store it in MySQL)
    )) || {};

  const link =
    rows && Array.isArray(rows) && rows.length > 0
      ? (rows[0] as EdgeLinkProps)
      : null;

  return link ? decodeLinkIfCaseSensitive(link) : null;
};
