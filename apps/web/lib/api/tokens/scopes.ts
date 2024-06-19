import { Role } from "@prisma/client";

export const scopes = [
  // Workspaces
  "workspaces.read",
  "workspaces.write",

  // Links
  "links.read",
  "links.write",

  // Tags
  "tags.read",
  "tags.write",

  // Analytics
  "analytics.read",

  // Domains
  "domains.read",
  "domains.write",

  // API tokens
  "tokens.read",
  "tokens.write",
] as const;

export type Scope = (typeof scopes)[number];

interface ScopeDescription {
  name: string;
  description: string;
  endpoints: string[];
  permissions: {
    scope: Scope;
    description: string;
    roles: Role[];
  }[];
}

export const scopeDescriptions = [
  {
    resource: "Workspaces",
    key: "workspaces",
    description: "Read, update, and delete workspaces",
    endpoints: ["/workspaces"],
    permissions: [
      {
        permission: "Read",
        scope: "workspaces.read",
        description: "Read workspaces",
        roles: ["owner", "member"],
      },
      {
        permission: "Write",
        scope: "workspaces.write",
        description: "Write workspaces",
        roles: ["owner"],
      },
    ],
  },
  {
    resource: "Links",
    key: "links",
    description: "Create, read, update, and delete links",
    endpoints: ["/links"],
    permissions: [
      {
        permission: "Read",
        scope: "links.read",
        description: "Read links",
        roles: ["owner", "member"],
      },
      {
        permission: "Write",
        scope: "links.write",
        description: "Write links",
        roles: ["owner", "member"],
      },
    ],
  },
  {
    resource: "Tags",
    key: "tags",
    description: "Create, read, update, and delete tags",
    endpoints: ["/tags"],
    permissions: [
      {
        permission: "Read",
        scope: "tags.read",
        description: "Read tags",
        roles: ["owner", "member"],
      },
      {
        permission: "Write",
        scope: "tags.write",
        description: "Write tags",
        roles: ["owner", "member"],
      },
    ],
  },
  {
    resource: "Domains",
    key: "domains",
    description: "Create, read, update, and delete domains",
    endpoints: ["/domains"],
    permissions: [
      {
        permission: "Read",
        scope: "domains.read",
        description: "Read domains",
        roles: ["owner", "member"],
      },
      {
        permission: "Write",
        scope: "domains.write",
        description: "Write domains",
        roles: ["owner"],
      },
    ],
  },
  {
    resource: "API Keys",
    key: "tokens",
    description: "Create, read, update, and delete API keys",
    endpoints: ["/tokens"],
    permissions: [
      {
        permission: "Read",
        scope: "tokens.read",
        description: "Read tokens",
        roles: ["owner", "member"],
      },
      {
        permission: "Write",
        scope: "tokens.write",
        description: "Write tokens",
        roles: ["owner", "member"],
      },
    ],
  },
  {
    resource: "Analytics",
    key: "analytics",
    description: "Read analytics",
    endpoints: ["/analytics"],
    permissions: [
      {
        permission: "Read",
        scope: "analytics.read",
        description: "Read analytics",
        roles: ["owner", "member"],
      },
    ],
  },
] as const;

// Map roles to scopes
// { owner: ["workspace.write"], member: ["workspace.read"] }
export const roleToScopes = scopeDescriptions.reduce<Record<Role, Scope[]>>(
  (acc, { permissions }) => {
    permissions.forEach(({ scope, roles }) => {
      roles.forEach((role) => {
        if (!acc[role]) {
          acc[role] = [];
        }

        acc[role].push(scope);
      });
    });

    return acc;
  },
  {} as Record<Role, Scope[]>,
);
