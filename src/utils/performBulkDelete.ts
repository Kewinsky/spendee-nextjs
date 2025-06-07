import { toast } from "sonner";

type BulkDeleteOptions<T> = {
  items: T[];
  getId: (item: T) => string;
  deleteFn: (ids: string[]) => Promise<{ success: boolean; error?: string }>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  resetSelection?: () => void;
  closeDrawer: () => void;
  resourceName: string;
};

export async function performBulkDelete<T>({
  items,
  getId,
  deleteFn,
  setData,
  resetSelection,
  closeDrawer,
  resourceName,
}: BulkDeleteOptions<T>) {
  const selectedIds = items.map(getId);

  await toast.promise(
    (async () => {
      const result = await deleteFn(selectedIds);

      if (result.success) {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(getId(item)))
        );
        resetSelection?.();
        closeDrawer();
      } else {
        throw new Error(result.error || `Failed to delete ${resourceName}`);
      }

      return `${selectedIds.length} ${resourceName} deleted successfully`;
    })(),
    {
      loading: `Deleting ${resourceName}...`,
      success: (msg) => msg,
      error: (err) => err?.message || `Failed to delete ${resourceName}`,
    }
  );
}
