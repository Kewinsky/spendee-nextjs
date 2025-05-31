import { toast } from "sonner";

type addOrUpdateItemOptions<T> = {
  formData: FormData;
  isEdit: boolean;
  createFn: (
    data: FormData
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  updateFn: (
    data: FormData
  ) => Promise<{ success: boolean; data?: T; error?: string }>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  closeDrawer: () => void;
  resetForm: () => void;
  resourceName: string;
  updateItemLocally?: (oldItem: T, newItem: T) => T;
  buildNewItem?: (newItem: T) => T;
};

export async function performAddOrUpdateItem<T>({
  formData,
  isEdit,
  createFn,
  updateFn,
  setData,
  closeDrawer,
  resetForm,
  resourceName,
  updateItemLocally,
  buildNewItem,
}: addOrUpdateItemOptions<T>) {
  await toast.promise(
    (async () => {
      const result = isEdit
        ? await updateFn(formData)
        : await createFn(formData);

      if (!result.success) {
        throw new Error(
          result.error ||
            `Failed to ${isEdit ? "update" : "create"} ${resourceName}`
        );
      }

      const updatedItem = result.data!;

      setData((prev) =>
        isEdit
          ? prev.map((item) =>
              (item as any).id === (updatedItem as any).id
                ? updateItemLocally
                  ? updateItemLocally(item, updatedItem)
                  : updatedItem
                : item
            )
          : [...prev, buildNewItem ? buildNewItem(updatedItem) : updatedItem]
      );

      closeDrawer();
      resetForm();

      return `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} ${
        isEdit ? "updated" : "created"
      } successfully`;
    })(),
    {
      loading: `${isEdit ? "Updating" : "Creating"} ${resourceName}...`,
      success: (msg) => msg,
      error: (err) =>
        err.message ||
        `Something went wrong while ${
          isEdit ? "updating" : "creating"
        } ${resourceName}`,
    }
  );
}
