import { nanoid, punyEncode } from "@dub/utils";
import { connect } from "@planetscale/database";
import { Customer, Project, User } from "@prisma/client";
import { DomainProps } from "./types";

export const DATABASE_URL =
  process.env.PLANETSCALE_DATABASE_URL || process.env.DATABASE_URL;

export const pscale_config = {
  url: DATABASE_URL,
};

export const conn = connect(pscale_config);

type GetCustomerParams =
  | {
      externalId: string;
      workspaceId: string;
    }
  | {
      externalId: string;
      projectConnectId: string;
    };

export const getWorkspaceViaEdge = async (workspaceId: string) => {
  if (!DATABASE_URL) return null;

  const { rows } =
    (await conn.execute<Project>("SELECT * FROM Project WHERE id = ? LIMIT 1", [
      workspaceId.replace("ws_", ""),
    ])) || {};

  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
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

export const getWorkspaceById = async (workspaceId: string) => {
  const { rows } = await conn.execute<Project>(
    "SELECT * FROM Project WHERE id = ? LIMIT 1",
    [workspaceId.replace("ws_", "")],
  );

  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

export const getWorkspaceBySlug = async (workspaceSlug: string) => {
  const { rows } = await conn.execute<Project>(
    "SELECT * FROM Project WHERE slug = ? LIMIT 1",
    [workspaceSlug],
  );

  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

export const createCustomer = async ({
  id,
  name,
  email,
  avatar,
  externalId,
  projectId,
  projectConnectId,
}: Omit<Customer, "createdAt" | "updatedAt">) => {
  return await conn.execute(
    "INSERT INTO Customer (id, name, email, avatar, externalId, projectId, projectConnectId, updatedAt) VALUES (?, ?, ?, ?, ?, ? ,?, ?)",
    [
      id,
      name,
      email,
      avatar,
      externalId,
      projectId,
      projectConnectId,
      new Date(),
    ],
  );
};

export const getCustomer = async (params: GetCustomerParams) => {
  const { externalId } = params;

  // By workspaceId
  if ("workspaceId" in params) {
    const { rows } = await conn.execute<Customer>(
      "SELECT * FROM Customer WHERE externalId = ? AND projectId = ? LIMIT 1",
      [externalId, params.workspaceId],
    );

    return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // By projectConnectId
  if ("projectConnectId" in params) {
    const { rows } = await conn.execute<Customer>(
      "SELECT * FROM Customer WHERE externalId = ? AND projectConnectId = ? LIMIT 1",
      [externalId, params.projectConnectId],
    );

    return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }
};
