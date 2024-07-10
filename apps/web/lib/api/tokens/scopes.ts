import { Role } from "@prisma/client";

export const SCOPES_NAMES = [
  "workspaces.read",
  "workspaces.write",
  "links.read",
  "links.write",
  "tags.read",
  "tags.write",
  "analytics.read",
  "domains.read",
  "domains.write",
  "conversions.write",
  "apis.all", // All API scopes
  "apis.read", // All read scopes
] as const;

export const PERMISSION_ACTIONS = [
  "workspaces.read",
  "workspaces.write",
  "links.read",
  "links.write",
  "tags.read",
  "tags.write",
  "analytics.read",
  "domains.read",
  "domains.write",
  "tokens.read",
  "tokens.write",
  "conversions.write",
] as const;

export const RESOURCES: Resource[] = [
  {
    name: "Links",
    key: "links",
    description: "Create, read, update, and delete links",
    betaFeature: false,
  },
  {
    name: "Analytics",
    key: "analytics",
    description: "Read analytics",
    betaFeature: false,
  },
  {
    name: "Workspaces",
    key: "workspaces",
    description: "Read, update, and delete workspaces",
    betaFeature: false,
  },
  {
    name: "Domains",
    key: "domains",
    description: "Create, read, update, and delete domains",
    betaFeature: false,
  },
  {
    name: "Tags",
    key: "tags",
    description: "Create, read, update, and delete tags",
    betaFeature: false,
  },
  {
    name: "Conversions",
    key: "conversions",
    description: "Track conversions (customer, lead, sales)",
    betaFeature: true,
  },
];

export const SCOPES: MasterScope[] = [
  {
    scope: "links.read",
    roles: ["owner", "member"],
    permissions: ["links.read"],
    type: "read",
    resource: "links",
  },
  {
    scope: "links.write",
    roles: ["owner", "member"],
    permissions: ["links.write", "links.read"],
    type: "write",
    resource: "links",
  },
  {
    scope: "tags.read",
    roles: ["owner", "member"],
    permissions: ["tags.read"],
    type: "read",
    resource: "tags",
  },
  {
    scope: "tags.write",
    roles: ["owner", "member"],
    permissions: ["tags.write", "tags.read"],
    type: "write",
    resource: "tags",
  },
  {
    scope: "domains.read",
    roles: ["owner", "member"],
    permissions: ["domains.read"],
    type: "read",
    resource: "domains",
  },
  {
    scope: "domains.write",
    roles: ["owner"],
    permissions: ["domains.write", "domains.read"],
    type: "write",
    resource: "domains",
  },
  {
    scope: "workspaces.read",
    roles: ["owner", "member"],
    permissions: ["workspaces.read"],
    type: "read",
    resource: "workspaces",
  },
  {
    scope: "workspaces.write",
    roles: ["owner"],
    permissions: ["workspaces.write", "workspaces.read"],
    type: "write",
    resource: "workspaces",
  },
  {
    scope: "analytics.read",
    roles: ["owner", "member"],
    permissions: ["analytics.read"],
    type: "read",
    resource: "analytics",
  },
  {
    scope: "conversions.write",
    roles: ["owner"],
    permissions: ["conversions.write"],
    type: "write",
    resource: "conversions",
  },
  {
    scope: "apis.read",
    roles: ["owner", "member"],
    permissions: PERMISSION_ACTIONS.filter(
      (action) => action.endsWith(".read") && !action.startsWith("tokens."),
    ),
  },
  {
    scope: "apis.all",
    roles: ["owner", "member"],
    permissions: PERMISSION_ACTIONS.map((action) => action).filter(
      (action) => !action.startsWith("tokens."),
    ),
  },
] as const;

export const PERMISSIONS: Permission[] = [
  {
    action: "links.read",
    roles: ["owner", "member"],
    resource: "links",
  },
  {
    action: "links.write",
    roles: ["owner", "member"],
    resource: "links",
  },
  {
    action: "analytics.read",
    roles: ["owner", "member"],
    resource: "analytics",
  },
  {
    action: "workspaces.read",
    roles: ["owner", "member"],
    resource: "workspaces",
  },
  {
    action: "workspaces.write",
    roles: ["owner"],
    resource: "workspaces",
  },
  {
    action: "domains.read",
    roles: ["owner", "member"],
    resource: "domains",
  },
  {
    action: "domains.write",
    roles: ["owner"],
    resource: "domains",
  },
  {
    action: "tags.read",
    roles: ["owner", "member"],
    resource: "tags",
  },
  {
    action: "tags.write",
    roles: ["owner", "member"],
    resource: "tags",
  },
  {
    action: "tokens.read",
    roles: ["owner", "member"],
    resource: "tokens",
  },
  {
    action: "tokens.write",
    roles: ["owner", "member"],
    resource: "tokens",
  },
  {
    action: "conversions.write",
    roles: ["owner"],
    resource: "conversions",
  },
];

export const SCOPES_BY_RESOURCE: ScopeByResource = SCOPES.reduce(
  (acc, scope) => {
    if (!scope.resource || !scope.type) {
      return acc;
    }

    if (!acc[scope.resource]) {
      acc[scope.resource] = [];
    }

    acc[scope.resource].push({
      scope: scope.scope,
      type: scope.type,
    });

    return acc;
  },
  {} as ScopeByResource,
);

// Scope to permissions mapping
export const SCOPE_PERMISSIONS_MAP: Record<Scope, PermissionAction[]> =
  SCOPES.reduce(
    (acc, scope) => {
      acc[scope.scope] = scope.permissions;
      return acc;
    },
    {} as Record<Scope, PermissionAction[]>,
  );

// Role to scopes mapping
export const ROLE_SCOPES_MAP: Record<Role, Scope[]> = SCOPES.reduce(
  (acc, scope) => {
    scope.roles.forEach((role) => {
      if (!acc[role]) {
        acc[role] = [];
      }

      acc[role].push(scope.scope);
    });

    return acc;
  },
  {} as Record<Role, Scope[]>,
);

// // For each scope, get the permissions it grants access to and return array of permissions
export const mapScopesToPermissions = (scopes: Scope[]) => {
  const permissions: PermissionAction[] = [];

  scopes.forEach((scope) => {
    if (SCOPE_PERMISSIONS_MAP[scope]) {
      permissions.push(...SCOPE_PERMISSIONS_MAP[scope]);
    }
  });

  return permissions;
};

// Get permissions by roles
export const getPermissionsByRole = (role: Role) => {
  return PERMISSIONS.filter((permission) =>
    permission.roles.includes(role),
  ).map((permission) => permission.action);
};

// Get SCOPES_BY_RESOURCE based on user role in a workspace
export const getScopesByResourceForRole = (role: Role) => {
  const allowedScopes = ROLE_SCOPES_MAP[role];
  // @ts-ignore
  const scopedResources: ScopeByResource = {};

  Object.keys(SCOPES_BY_RESOURCE).forEach((resourceKey) => {
    SCOPES_BY_RESOURCE[resourceKey].forEach((scope) => {
      if (allowedScopes.includes(scope.scope)) {
        if (!scopedResources[resourceKey]) {
          scopedResources[resourceKey] = [];
        }

        scopedResources[resourceKey].push(scope);
      }
    });
  });

  return scopedResources;
};

export const scopePresets = [
  {
    value: "all_access",
    label: "All",
    description: "full access to all resources",
  },
  {
    value: "read_only",
    label: "Read Only",
    description: "read-only access to all resources",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "restricted access to some resources",
  },
];

export const scopesToName = (scopes: string[]) => {
  if (scopes.includes("apis.all")) {
    return {
      name: "All access",
      description: "full access to all resources",
    };
  }

  if (scopes.includes("apis.read")) {
    return {
      name: "Read-only",
      description: "read-only access to all resources",
    };
  }

  return {
    name: "Restricted",
    description: "restricted access to some resources",
  };
};

export const validateScopesForRole = (scopes: Scope[], role: Role) => {
  const allowedScopes = ROLE_SCOPES_MAP[role];
  const invalidScopes = scopes.filter(
    (scope) => !allowedScopes.includes(scope),
  );

  return !(invalidScopes.length > 0);
};

export type Scope = (typeof SCOPES_NAMES)[number];

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ResourceKeys =
  | "links"
  | "workspaces"
  | "analytics"
  | "domains"
  | "tags"
  | "tokens"
  | "conversions";

type Resource = {
  name: string;
  key: ResourceKeys;
  description: string;
  betaFeature: boolean;
};

type Permission = {
  action: PermissionAction;
  roles: Role[];
  resource: ResourceKeys;
};

type MasterScope = {
  scope: Scope;
  roles: Role[];
  permissions: PermissionAction[];
  type?: "read" | "write";
  resource?: ResourceKeys;
};

export type ScopeByResource = {
  [key in ResourceKeys]: {
    scope: Scope;
    type: "read" | "write";
  }[];
};
