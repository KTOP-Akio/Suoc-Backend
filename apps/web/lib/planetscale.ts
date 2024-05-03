import { nanoid, punyEncode } from "@dub/utils";
import { connect } from "@planetscale/database";
import { User } from "@prisma/client";
import { DomainProps, WorkspaceProps } from "./types";

export const DATABASE_URL =
  process.env.PLANETSCALE_DATABASE_URL || process.env.DATABASE_URL;

export const pscale_config = {
  url: DATABASE_URL,
};

export const conn = connect(pscale_config);

export const getWorkspaceViaEdge = async (workspaceId: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute("SELECT * FROM Project WHERE id = ?", [
      workspaceId.replace("ws_", ""),
    ])) || {};

  return rows && Array.isArray(rows) && rows.length > 0
    ? (rows[0] as WorkspaceProps)
    : null;
};

export const incrementWorkspaceAIUsage = async (workspaceId: string) => {
  if (!DATABASE_URL) return null;

  return await conn.execute(
    "UPDATE Project p SET p.aiUsage = p.aiUsage + 1 WHERE id = ?",
    [workspaceId.replace("ws_", "")],
  );
};

export const getDomainViaEdge = async (domain: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute("SELECT * FROM Domain WHERE slug = ?", [domain])) || {};

  return rows && Array.isArray(rows) && rows.length > 0
    ? (rows[0] as DomainProps)
    : null;
};

export const checkIfKeyExists = async (domain: string, key: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute(
      "SELECT 1 FROM Link WHERE domain = ? AND `key` = ? LIMIT 1",
      [domain, punyEncode(decodeURIComponent(key))], // we need to make sure that the key is always URI-decoded + punycode-encoded (cause that's how we store it in MySQL)
    )) || {};

  return rows && Array.isArray(rows) && rows.length > 0;
};

export const checkIfUserExists = async (userId: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute("SELECT 1 FROM User WHERE id = ? LIMIT 1", [userId])) ||
    {};

  return rows && Array.isArray(rows) && rows.length > 0;
};

export const getLinkViaEdge = async (domain: string, key: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute(
      "SELECT * FROM Link WHERE domain = ? AND `key` = ?",
      [domain, punyEncode(decodeURIComponent(key))], // we need to make sure that the key is always URI-decoded + punycode-encoded (cause that's how we store it in MySQL)
    )) || {};

  return rows && Array.isArray(rows) && rows.length > 0
    ? (rows[0] as {
        id: string;
        domain: string;
        key: string;
        url: string;
        proxy: number;
        title: string;
        description: string;
        image: string;
        rewrite: number;
        password: string | null;
        expiresAt: string | null;
        ios: string | null;
        android: string | null;
        geo: object | null;
        projectId: string;
        publicStats: number;
      })
    : null;
};

export async function getDomainOrLink({
  domain,
  key,
}: {
  domain: string;
  key?: string;
}) {
  if (!key || key === "_root") {
    const data = await getDomainViaEdge(domain);
    if (!data) return null;
    return {
      ...data,
      key: "_root",
      url: data?.target,
    };
  } else {
    return await getLinkViaEdge(domain, key);
  }
}

export async function getRandomKey({
  domain,
  prefix,
  long,
}: {
  domain: string;
  prefix?: string;
  long?: boolean;
}): Promise<string> {
  /* recursively get random key till it gets one that's available */
  let key = long ? nanoid(69) : nanoid();
  if (prefix) {
    key = `${prefix.replace(/^\/|\/$/g, "")}/${key}`;
  }
  const exists = await checkIfKeyExists(domain, key);
  if (exists) {
    // by the off chance that key already exists
    return getRandomKey({ domain, prefix, long });
  } else {
    return key;
  }
}

export const getToken = async (hashedKey: string) => {
  const { rows } = await conn.execute<User>(
    // "SELECT User.id, User.name, User.email FROM Token JOIN User ON Token.userId = User.id WHERE hashedKey = ? LIMIT 1",
    "SELECT * FROM User WHERE User.ID IN (SELECT userId FROM Token WHERE hashedKey = ? AND userId IS NOT NULL) LIMIT 1",
    [hashedKey],
  );

  return rows.length > 0 ? rows[0] : null;
};

export const updateTokenLastUsed = async (hashedKey: string) => {
  return await conn.execute(
    "UPDATE Token SET lastUsed = NOW() WHERE hashedKey = ?",
    [hashedKey],
  );
};
