import { toast } from "sonner";

type BulkDeleteOptions<T> = {
  items: T[];
  getId: (item: T) => string;
  deleteFn: (ids: string[]) => Promise<{ success: boolean }[]>;
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
      const results = await deleteFn(selectedIds);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(getId(item)))
        );
        resetSelection?.();
        closeDrawer();
      }

      if (failureCount > 0) {
        throw new Error(`Failed to delete ${failureCount} ${resourceName}`);
      }

      return `${successCount} ${resourceName} deleted successfully`;
    })(),
    {
      loading: `Deleting ${resourceName}...`,
      success: (msg) => msg,
      error: (err) => err?.message || `Failed to delete ${resourceName}`,
    }
  );
}
