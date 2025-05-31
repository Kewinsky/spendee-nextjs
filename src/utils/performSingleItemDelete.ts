import { toast } from "sonner";

type SingleItemDeleteOptions<T> = {
  id: string;
  deleteFn: (id: string) => Promise<{ success: boolean; error?: string }>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  resourceName: string;
};

export async function performSingleItemDelete<T>({
  id,
  deleteFn,
  setData,
  resourceName,
}: SingleItemDeleteOptions<T>) {
  await toast.promise(
    (async () => {
      const result = await deleteFn(id);

      if (result.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        return `${
          resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
        } deleted successfully`;
      } else {
        throw new Error(result.error || `Failed to delete ${resourceName}`);
      }
    })(),
    {
      loading: `Deleting ${resourceName}...`,
      success: (message) => message,
      error: (err) =>
        err.message || `Something went wrong while deleting ${resourceName}`,
    }
  );
}
