import { FolderProps } from "@/lib/types";
import { fetcher } from "@dub/utils";
import { FolderUserRole } from "@prisma/client";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useFolders() {
  const { id } = useWorkspace();

  const {
    data: folders,
    isValidating,
    isLoading,
  } = useSWR<(FolderProps & { role: FolderUserRole })[]>(
    id && `/api/folders?workspaceId=${id}`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    folders,
    isLoading,
    isValidating,
  };
}
