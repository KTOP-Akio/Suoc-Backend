import { cn } from "@dub/utils";
import { useUserAvatarUrl } from "./hooks";

export function Avatar({
  user = {},
  className,
}: {
  user?: {
    id?: string | null | undefined;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
  className?: string;
}) {
  if (!user) {
    return (
      <div
        className={cn(
          "h-10 w-10 animate-pulse rounded-full border border-gray-300 bg-gray-100",
          className,
        )}
      />
    );
  }

  const url = useUserAvatarUrl(user);

  return (
    <img
      alt={`Avatar for ${user.name || user.email}`}
      referrerPolicy="no-referrer"
      src={url}
      className={cn("h-10 w-10 rounded-full border border-gray-300", className)}
      draggable={false}
    />
  );
}

export function TokenAvatar({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <img
      src={`https://api.dicebear.com/7.x/shapes/svg?seed=${id}`}
      alt="avatar"
      className={cn("h-10 w-10 rounded-full", className)}
      draggable={false}
    />
  );
}
