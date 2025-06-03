"use client";

import * as React from "react";
import { IconDotsVertical, IconPlus } from "@tabler/icons-react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  Trash2,
  Plus,
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

// Import the proper schemas and types
import {
  budgetFormSchema,
  emptyBudgetForm,
  type BudgetFormValues,
  type BudgetWithStats,
} from "@/services/budgets/schema";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  deleteBudgets,
} from "../actions";
import { formatCurrency } from "@/utils/formatting";
import { performBulkDelete } from "@/utils/performBulkDelete";
import { performSingleItemDelete } from "@/utils/performSingleItemDelete";
import { performAddOrUpdateItem } from "@/utils/performAddOrUpdateItem";

export function BudgetTable({
  data: initialData,
  categories = [],
  usedCategoryIds = [],
}: {
  data: BudgetWithStats[];
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
  usedCategoryIds?: string[];
}) {
  const [activeItem, setActiveItem] = React.useState<BudgetWithStats | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [data, setData] = React.useState(() => initialData);
  const [selectedBudgets, setSelectedBudgets] = React.useState<
    BudgetWithStats[]
  >([]);

  const openTableCellViewer = (
    item: BudgetWithStats | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    await performSingleItemDelete({
      id,
      deleteFn: deleteBudget,
      setData,
      resourceName: "budget",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedBudgets(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const deleteBudgetsBulk = async (ids: string[]) => {
    return deleteBudgets(ids);
  };

  const confirmBulkDelete = async () => {
    await performBulkDelete({
      items: selectedBudgets,
      getId: (item) => item.id,
      deleteFn: deleteBudgetsBulk,
      setData,
      resetSelection: () => table.resetRowSelection(),
      closeDrawer,
      resourceName: "budget(s)",
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
    setSelectedBudgets([]);
  };

  const columns: ColumnDef<BudgetWithStats>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Name
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
            {row.original.name}
          </Button>
        );
      },
      enableHiding: false,
      enableSorting: true,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category!;
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground px-1.5 flex items-center w-fit"
          >
            {getIconBySlug(category.icon)}
            {category.name}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
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
      cell: ({ row }) => formatCurrency(row.original.amount),
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
      cell: ({ row }) => formatCurrency(row.original.spent || 0),
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
              Edit budget
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
        <div className="flex flex-wrap items-center gap-2">
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
      <BudgetTableCellViewer
        activeItem={activeItem}
        viewMode={viewMode}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        closeDrawer={closeDrawer}
        setData={setData}
        selectedBudgets={selectedBudgets}
        confirmBulkDelete={confirmBulkDelete}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
      />
    </Tabs>
  );
}

function BudgetTableCellViewer({
  activeItem,
  viewMode,
  isDrawerOpen,
  setIsDrawerOpen,
  closeDrawer,
  setData,
  selectedBudgets = [],
  confirmBulkDelete,
  categories = [],
  usedCategoryIds = [],
}: {
  activeItem: BudgetWithStats | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<BudgetWithStats[]>>;
  selectedBudgets?: BudgetWithStats[];
  confirmBulkDelete?: () => void;
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
  usedCategoryIds?: string[];
}) {
  const isMobile = useIsMobile();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: activeItem
      ? {
          name: activeItem.name,
          categoryId: activeItem.categoryId,
          amount: activeItem.amount.toString(),
          description: activeItem.description || "",
        }
      : emptyBudgetForm,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        name: activeItem.name,
        categoryId: activeItem.categoryId,
        amount: activeItem.amount.toString(),
        description: activeItem.description || "",
      });
    } else {
      form.reset(emptyBudgetForm);
    }
  }, [activeItem, form]);

  const onSubmit = async (values: BudgetFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("categoryId", values.categoryId);
    formData.append("amount", values.amount);
    formData.append("description", values.description || "");
    if (activeItem) formData.append("id", activeItem.id);

    await performAddOrUpdateItem({
      formData,
      isEdit: !!activeItem,
      createFn: createBudget,
      updateFn: updateBudget,
      setData,
      closeDrawer,
      resetForm: form.reset,
      resourceName: "budget",
    });
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
                        <span className="font-medium">{budget.name}</span>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground px-1.5 flex items-center"
                        >
                          {budget.category?.icon &&
                            getIconBySlug(budget.category.icon)}
                          {budget.category?.name}
                        </Badge>
                      </div>
                      <div>{formatCurrency(budget.amount)}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {budget.description || "N/A"}
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
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Name</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">{field.value}</div>
                    ) : (
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Monthly Groceries"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Description (optional)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {field.value || "N/A"}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="Budget description..." />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Category</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md flex items-center">
                        {getIconBySlug(activeItem!.category!.icon)}
                        {activeItem!.category!.name}
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
                          {(() => {
                            const availableCategories = categories.filter(
                              (cat) =>
                                cat.type === "EXPENSE" &&
                                (!usedCategoryIds.includes(cat.id) ||
                                  cat.id === activeItem?.categoryId)
                            );

                            return (
                              <>
                                {availableCategories.length === 0 && (
                                  <div className="px-4 py-2 text-muted-foreground text-sm italic">
                                    No available categories
                                  </div>
                                )}

                                {availableCategories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    <div className="flex items-center">
                                      {getIconBySlug(category.icon)}
                                      {category.name}
                                    </div>
                                  </SelectItem>
                                ))}

                                <div className="pt-1 border-t">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start text-sm text-muted-foreground"
                                    onClick={() =>
                                      (window.location.href = "/categories")
                                    }
                                  >
                                    <Plus />
                                    Add new category
                                  </Button>
                                </div>
                              </>
                            );
                          })()}
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
                        {formatCurrency(Number.parseFloat(field.value))}
                      </div>
                    ) : (
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min={0.01}
                          placeholder="0.00"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                {/* Spent - View only */}
                {isReadOnly && activeItem?.spent !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Spent</FormLabel>
                    <div className="p-2 border rounded-md">
                      {formatCurrency(activeItem.spent)}
                    </div>
                  </FormItem>
                )}

                {/* Remaining - View only */}
                {isReadOnly && activeItem?.remaining !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Remaining</FormLabel>
                    <div className="p-2 border rounded-md">
                      {formatCurrency(activeItem.remaining)}
                    </div>
                  </FormItem>
                )}
              </div>

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
                        {formatCurrency(activeItem.spent || 0)} of{" "}
                        {formatCurrency(activeItem.amount)} (
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
