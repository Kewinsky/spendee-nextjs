"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  Trash2,
  Package,
  Utensils,
  Car,
  Home,
  Film,
  Heart,
} from "lucide-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { getIconBySlug } from "@/utils/getIconBySlug";
import { getStatusColorByPercentage } from "@/utils/getStatusColorByPercentage";

// Schema for budget data
export const budgetSchema = z.object({
  id: z.number(),
  category: z.string(),
  icon: z.string().default("Package"),
  amount: z.number(),
  spent: z.number().optional(),
  progress: z.number().optional(),
});

export type Budget = z.infer<typeof budgetSchema>;

// Form schema for adding/editing budgets
const budgetFormSchema = z.object({
  id: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  spent: z.coerce.number().optional(),
  progress: z.coerce.number().optional(),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

const emptyBudgetForm: BudgetFormValues = {
  category: "",
  amount: 0,
  spent: 0,
  progress: 0,
};

export function BudgetTable({
  data: initialData,
  categories = [],
}: {
  data: Budget[];
  categories?: { id: number; name: string; type: string }[];
}) {
  const [activeItem, setActiveItem] = React.useState<Budget | null>(null);
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [data, setData] = React.useState(() => initialData);
  const [selectedBudgets, setSelectedBudgets] = React.useState<Budget[]>([]);

  const openTableCellViewer = (
    item: Budget | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteBudget = (id: number) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Deleting budget...",
      success: () => {
        setData((prev) => prev.filter((item) => item.id !== id));
        return "Budget deleted successfully";
      },
      error: "Failed to delete budget",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedBudgets(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const confirmBulkDelete = () => {
    const selectedIds = selectedBudgets.map((item) => item.id);

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Deleting ${selectedIds.length} budget(s)...`,
      success: () => {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        table.resetRowSelection();
        closeDrawer();
        return `${selectedIds.length} budget(s) deleted successfully`;
      },
      error: "Failed to delete budgets",
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
    setSelectedBudgets([]);
  };

  const columns: ColumnDef<Budget>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Category
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left"
            onClick={() => openTableCellViewer(row.original, "view")}
          >
            {getIconBySlug(row.original.icon || "Package")}
            {row.original.category}
          </Button>
        );
      },
      enableHiding: false,
      enableSorting: true,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.original.amount;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "spent",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Spent
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const spent = row.original.spent || 0;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(spent);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const amount = row.original.amount;
        const spent = row.original.spent || 0;
        const progress = amount > 0 ? (spent / amount) * 100 : 0;

        return (
          <div className="w-full space-y-1">
            <Progress
              value={progress}
              className={`h-2 ${getStatusColorByPercentage(
                Math.round(progress)
              )}`}
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => openTableCellViewer(row.original, "edit")}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openTableCellViewer(row.original, "view")}
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDeleteBudget(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const hasSelectedRows = table.getFilteredSelectedRowModel().rows.length > 0;

  return (
    <Tabs className="w-full flex-col justify-start gap-6">
      <div className="flex flex-wrap items-start justify-end gap-4 px-4 lg:px-6">
        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openTableCellViewer(null, "add")}
            >
              <IconPlus />
              <span className="hidden lg:inline">Add Budget</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={!hasSelectedRows}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden lg:inline">Delete Selected</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No budgets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <TableCellViewer
        activeItem={activeItem}
        viewMode={viewMode}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        closeDrawer={closeDrawer}
        setData={setData}
        selectedBudgets={selectedBudgets}
        confirmBulkDelete={confirmBulkDelete}
        categories={categories}
      />
    </Tabs>
  );
}

function TableCellViewer({
  activeItem,
  viewMode,
  isDrawerOpen,
  setIsDrawerOpen,
  closeDrawer,
  setData,
  selectedBudgets = [],
  confirmBulkDelete,
  categories = [],
}: {
  activeItem: Budget | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<Budget[]>>;
  selectedBudgets?: Budget[];
  confirmBulkDelete?: () => void;
  categories?: { id: number; name: string; type: string }[];
}) {
  const isMobile = useIsMobile();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          category: activeItem.category,
          amount: activeItem.amount,
          spent: activeItem.spent,
          progress: activeItem.progress,
        }
      : emptyBudgetForm,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        id: activeItem.id,
        category: activeItem.category,
        amount: activeItem.amount,
        spent: activeItem.spent,
        progress: activeItem.progress,
      });
    } else {
      form.reset(emptyBudgetForm);
    }
  }, [activeItem, form]);

  const onSubmit = (values: BudgetFormValues) => {
    const newBudget: Budget = {
      id: values.id || Date.now(),
      category: values.category,
      amount: values.amount,
      spent: values.spent || 0,
      progress: values.progress || 0,
    };

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: activeItem ? "Updating budget..." : "Adding budget...",
      success: () => {
        if (activeItem) {
          setData((prev) =>
            prev.map((item) => (item.id === activeItem.id ? newBudget : item))
          );
          return "Budget updated successfully";
        } else {
          setData((prev) => [...prev, newBudget]);
          form.reset(emptyBudgetForm);
          return "Budget added successfully";
        }
      },
      error: "Failed to save budget",
    });

    closeDrawer();
  };

  const isReadOnly = viewMode === "view";
  const isDeleteConfirm = viewMode === "delete-confirm";

  if (isDeleteConfirm) {
    return (
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Confirm Deletion</DrawerTitle>
            <DrawerDescription>
              Are you sure you want to delete {selectedBudgets.length}{" "}
              budget(s)?
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Selected budgets:</h3>
              <div className="max-h-[300px] overflow-y-auto">
                {selectedBudgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{budget.category}</span>
                      </div>
                      <div>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(budget.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              This action cannot be undone. These budgets will be permanently
              deleted.
            </div>
          </div>
          <DrawerFooter>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Confirm Delete
            </Button>
            <Button variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>
            {viewMode === "add"
              ? "Add Budget"
              : viewMode === "edit"
              ? "Edit Budget"
              : "Budget Details"}
          </DrawerTitle>
          <DrawerDescription>
            {viewMode === "add"
              ? "Add a new budget to your records"
              : viewMode === "edit"
              ? "Update budget information"
              : "View budget details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Form {...form}>
            <form
              id="budget-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Category</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md flex items-center">
                        {getIconBySlug(activeItem?.icon || "Package")}
                        {field.value}
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="groceries">
                            <div className="flex items-center">
                              <Package className="mr-2 h-4 w-4" />
                              Groceries
                            </div>
                          </SelectItem>
                          <SelectItem value="housing">
                            <div className="flex items-center">
                              <Home className="mr-2 h-4 w-4" />
                              Housing
                            </div>
                          </SelectItem>
                          <SelectItem value="transportation">
                            <div className="flex items-center">
                              <Car className="mr-2 h-4 w-4" />
                              Transportation
                            </div>
                          </SelectItem>
                          <SelectItem value="dining">
                            <div className="flex items-center">
                              <Utensils className="mr-2 h-4 w-4" />
                              Dining
                            </div>
                          </SelectItem>
                          <SelectItem value="entertainment">
                            <div className="flex items-center">
                              <Film className="mr-2 h-4 w-4" />
                              Entertainment
                            </div>
                          </SelectItem>
                          <SelectItem value="healthcare">
                            <div className="flex items-center">
                              <Heart className="mr-2 h-4 w-4" />
                              Healthcare
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Amount</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(field.value)}
                      </div>
                    ) : (
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min={0.01}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Spent - View only */}
              {isReadOnly && activeItem?.spent !== undefined && (
                <FormField
                  control={form.control}
                  name="spent"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Spent</FormLabel>
                      <div className="p-2 border rounded-md">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(field.value || 0)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Progress - View only */}
              {isReadOnly &&
                activeItem?.amount &&
                activeItem?.spent !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Progress</FormLabel>
                    <div className="space-y-2">
                      <Progress
                        value={Math.min(
                          100,
                          ((activeItem.spent || 0) / activeItem.amount) * 100
                        )}
                        className={`h-2 ${getStatusColorByPercentage(
                          ((activeItem.spent || 0) / activeItem.amount) * 100
                        )}`}
                      />
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(activeItem.spent || 0)}{" "}
                        of{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(activeItem.amount)}{" "}
                        (
                        {Math.round(
                          ((activeItem.spent || 0) / activeItem.amount) * 100
                        )}
                        %)
                      </p>
                    </div>
                  </FormItem>
                )}
            </form>
          </Form>
        </div>

        <DrawerFooter>
          {isReadOnly ? (
            <Button variant="outline" onClick={closeDrawer}>
              Close
            </Button>
          ) : (
            <>
              <Button type="submit" form="budget-form">
                {activeItem ? "Update Budget" : "Add Budget"}
              </Button>
              <Button variant="outline" onClick={closeDrawer}>
                Cancel
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
