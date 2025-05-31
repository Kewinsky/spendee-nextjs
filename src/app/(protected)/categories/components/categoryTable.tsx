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
  Package,
  Utensils,
  Car,
  Home,
  Lightbulb,
  Film,
  Heart,
  Briefcase,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getIconBySlug } from "@/utils/getIconBySlug";
import {
  categoryFormSchema,
  emptyCategoryForm,
  type CategoryFormValues,
  type CategoryWithStats,
} from "@/services/categories/schema";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategories,
} from "../actions";
import { formatCurrency, formatPercentage } from "@/utils/formatting";
import { performBulkDelete } from "@/utils/performBulkDelete";
import { performSingleItemDelete } from "@/utils/performSingleItemDelete";
import { performAddOrUpdateItem } from "@/utils/performAddOrUpdateItem";

export function CategoryTable({
  data: initialData,
}: {
  data: CategoryWithStats[];
}) {
  const [activeItem, setActiveItem] = React.useState<CategoryWithStats | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("expenses");
  const [data, setData] = React.useState(() => initialData);
  const [selectedCategories, setSelectedCategories] = React.useState<
    CategoryWithStats[]
  >([]);

  const openTableCellViewer = (
    item: CategoryWithStats | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    await performSingleItemDelete({
      id,
      deleteFn: deleteCategory,
      setData,
      resourceName: "category",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedCategories(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const deleteCategoriesBulk = async (ids: string[]) => {
    return Promise.all(ids.map((id) => deleteCategories(id)));
  };

  const confirmBulkDelete = async () => {
    await performBulkDelete({
      items: selectedCategories,
      getId: (item) => item.id,
      deleteFn: deleteCategoriesBulk,
      setData,
      resetSelection: () => table.resetRowSelection(),
      closeDrawer,
      resourceName: "category(ies)",
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
    setSelectedCategories([]);
  };

  // Define columns for expenses
  const columns: ColumnDef<CategoryWithStats>[] = [
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
            className="text-foreground w-fit px-0 text-left flex items-center gap-2"
            onClick={() => openTableCellViewer(row.original, "view")}
          >
            {getIconBySlug(row.original.icon || "Package")}
            {row.original.name}
          </Button>
        );
      },
      enableHiding: false,
      enableSorting: true,
    },
    {
      accessorKey: activeTab === "expenses" ? "transactions" : "accounts",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            {activeTab === "expenses" ? "Transactions" : "Accounts"}
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
      cell: ({ row }) =>
        activeTab === "expenses"
          ? row.original.transactions || 0
          : row.original.accounts || 0,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: activeTab === "expenses" ? "budgetAmount" : "balance",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            {activeTab === "expenses" ? "Budget Amount" : "Balance"}
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
        const amount =
          activeTab === "expenses"
            ? row.original.budgetAmount || 0
            : row.original.balance || 0;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
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
              Edit category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openTableCellViewer(row.original, "view")}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDeleteCategory(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    let result = data;

    // Filter by tab
    result = result.filter((item) =>
      activeTab === "expenses"
        ? item.type === "EXPENSE"
        : item.type === "INCOME"
    );

    return result;
  }, [data, activeTab]);

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
    data: filteredData,
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
    <Tabs
      defaultValue="expenses"
      className="w-full flex-col justify-start gap-6"
      onValueChange={setActiveTab}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>

          <Select defaultValue="expenses" onValueChange={setActiveTab}>
            <SelectTrigger
              className="w-fit sm:w-40 @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="incomes">Incomes</SelectItem>
            </SelectContent>
          </Select>

          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="incomes">Incomes</TabsTrigger>
          </TabsList>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTableCellViewer(null, "add")}
          >
            <IconPlus />
            <span className="hidden lg:inline">Add Category</span>
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

      <TabsContent
        value="expenses"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
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
                    No expense categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent
        value="incomes"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
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
                    No income categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TableCellViewer
        activeItem={activeItem}
        viewMode={viewMode}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        closeDrawer={closeDrawer}
        setData={setData}
        selectedCategories={selectedCategories}
        confirmBulkDelete={confirmBulkDelete}
        activeTab={activeTab}
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
  selectedCategories = [],
  confirmBulkDelete,
  activeTab,
}: {
  activeItem: CategoryWithStats | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<CategoryWithStats[]>>;
  selectedCategories?: CategoryWithStats[];
  confirmBulkDelete?: () => void;
  activeTab: string;
}) {
  const isMobile = useIsMobile();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: activeItem
      ? {
          name: activeItem.name,
          description: activeItem.description || "",
          type: activeItem.type,
          icon: activeItem.icon || "Package",
        }
      : {
          ...emptyCategoryForm,
          type: activeTab === "expenses" ? "EXPENSE" : "INCOME",
        },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        name: activeItem.name,
        description: activeItem.description || "",
        type: activeItem.type,
        icon: activeItem.icon || "Package",
      });
    } else {
      form.reset({
        ...emptyCategoryForm,
        type: activeTab === "expenses" ? "EXPENSE" : "INCOME",
      });
    }
  }, [activeItem, form, activeTab]);

  const onSubmit = async (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    formData.append("type", values.type);
    formData.append("icon", values.icon);
    if (activeItem) formData.append("id", activeItem.id);

    await performAddOrUpdateItem({
      formData,
      isEdit: !!activeItem,
      createFn: createCategory,
      updateFn: updateCategory,
      setData,
      closeDrawer,
      resetForm: form.reset,
      resourceName: "category",
      updateItemLocally: (oldItem, newItem) => ({
        ...oldItem,
        ...newItem,
        transactions: oldItem.transactions,
        budget: oldItem.budgetAmount,
        spent: oldItem.spent,
        balance: oldItem.balance,
      }),
      buildNewItem: (newItem) => ({
        ...newItem,
        transactions: 0,
        budgetAmount: undefined,
        spent: undefined,
        balance: undefined,
      }),
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
              Are you sure you want to delete {selectedCategories.length}{" "}
              category(ies)?
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Selected categories:</h3>
              <div className="max-h-[300px] overflow-y-auto">
                {selectedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        <Badge
                          variant="outline"
                          className={
                            category.type === "INCOME"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : "bg-red-100 text-destructive dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {category.type === "INCOME" ? "Income" : "Expense"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.description || "No description..."}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              This action cannot be undone. These categories will be permanently
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
              ? "Add Category"
              : viewMode === "edit"
              ? "Edit Category"
              : "Category Details"}
          </DrawerTitle>
          <DrawerDescription>
            {viewMode === "add"
              ? "Add a new category to your records"
              : viewMode === "edit"
              ? "Update category information"
              : "View category details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Form {...form}>
            <form
              id="category-form"
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
                        <Input {...field} placeholder="e.g., Transport" />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {field.value || "No description..."}
                      </div>
                    ) : (
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Category description..."
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Type</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {field.value === "INCOME" ? "Income" : "Expense"}
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                          <SelectItem value="INCOME">Income</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Icon</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md flex items-center">
                        {getIconBySlug(field.value)}
                        {field.value}
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "Package"}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Package">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Package
                            </div>
                          </SelectItem>
                          <SelectItem value="Utensils">
                            <div className="flex items-center gap-2">
                              <Utensils className="h-4 w-4" />
                              Utensils
                            </div>
                          </SelectItem>
                          <SelectItem value="Car">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Car
                            </div>
                          </SelectItem>
                          <SelectItem value="Home">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              Home
                            </div>
                          </SelectItem>
                          <SelectItem value="Lightbulb">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Lightbulb
                            </div>
                          </SelectItem>
                          <SelectItem value="Film">
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4" />
                              Film
                            </div>
                          </SelectItem>
                          <SelectItem value="Heart">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Heart
                            </div>
                          </SelectItem>
                          <SelectItem value="Briefcase">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Briefcase
                            </div>
                          </SelectItem>
                          <SelectItem value="TrendingUp">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              TrendingUp
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keep existing transactions field only for Expense categories */}
              {isReadOnly &&
                activeItem?.type === "EXPENSE" &&
                activeItem?.transactions !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Transactions</FormLabel>
                    <div className="p-2 border rounded-md">
                      {activeItem.transactions}
                    </div>
                  </FormItem>
                )}

              {/* Budget Name - Only show for Expense categories in view mode */}
              {isReadOnly &&
                activeItem?.type === "EXPENSE" &&
                activeItem?.budgetName && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Budget Name</FormLabel>
                    <div className="p-2 border rounded-md">
                      {activeItem.budgetName}
                    </div>
                  </FormItem>
                )}

              {/* Budget Amount- Only show for Expense categories in view mode */}
              {isReadOnly &&
                activeItem?.type === "EXPENSE" &&
                activeItem?.budgetAmount && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Budget Amount</FormLabel>
                    <div className="p-2 border rounded-md">
                      {formatCurrency(activeItem.budgetAmount)}
                    </div>
                  </FormItem>
                )}

              {/* Accounts - Show for Income categories instead of transactions */}
              {isReadOnly &&
                activeItem?.type === "INCOME" &&
                activeItem?.accounts !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Accounts</FormLabel>
                    <div className="p-2 border rounded-md">
                      {activeItem.accounts}
                    </div>
                  </FormItem>
                )}

              {/* Progress for expense categories with budget */}
              {isReadOnly &&
                activeItem?.budgetAmount &&
                activeItem?.spent !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Progress</FormLabel>
                    <div className="space-y-2">
                      <Progress
                        value={Math.min(
                          100,
                          ((activeItem.spent || 0) / activeItem.budgetAmount) *
                            100
                        )}
                        className="h-2"
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
                        }).format(activeItem.budgetAmount)}{" "}
                        (
                        {Math.round(
                          ((activeItem.spent || 0) / activeItem.budgetAmount) *
                            100
                        )}
                        %)
                      </p>
                    </div>
                  </FormItem>
                )}

              {/* Balance for income categories */}
              {isReadOnly &&
                activeItem?.type === "INCOME" &&
                activeItem?.accounts !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Total Balance</FormLabel>
                    <div className="p-2 border rounded-md">
                      {formatCurrency(activeItem.balance as number)}
                    </div>
                  </FormItem>
                )}

              {/* Average Growth - Show for Income categories */}
              {isReadOnly &&
                activeItem?.type === "INCOME" &&
                activeItem?.accounts !== undefined && (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Average Growth (%)</FormLabel>
                    <div className="p-2 border rounded-md flex items-center gap-2">
                      <span
                        className={
                          Number.parseFloat(activeItem.averageGrowth) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }
                      >
                        {Number.parseFloat(activeItem.averageGrowth) >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </span>
                      <span>
                        {formatPercentage(
                          Number.parseFloat(activeItem.averageGrowth)
                        )}
                      </span>
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
              <Button type="submit" form="category-form">
                {activeItem ? "Update Category" : "Add Category"}
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
