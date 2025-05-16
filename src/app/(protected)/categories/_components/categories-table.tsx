"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import {
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  period: z.enum([
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "semi-annually",
    "annually",
  ]),
  transactions: z.number(),
  amount: z.number(),
  spent: z.number(),
  type: z.enum(["Expense", "Income"]),
});

export type Category = z.infer<typeof categorySchema>;

const periodLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "semi-annually": "Every 6 Months",
  annually: "Yearly",
};

const categoryFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  period: z.enum([
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "semi-annually",
    "annually",
  ]),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["Expense", "Income"]),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const emptyCategoryForm: CategoryFormValues = {
  name: "",
  description: "",
  period: "monthly",
  amount: "",
  type: "Expense",
};

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableRow({ row }: { row: Row<Category> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function CategoriesAndBudgetsTable({
  data: initialData,
}: {
  data: Category[];
}) {
  const [activeItem, setActiveItem] = React.useState<Category | null>(null);
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [data, setData] = React.useState(() => initialData);
  const [selectedCategories, setSelectedCategories] = React.useState<
    Category[]
  >([]);
  const [activeTab, setActiveTab] = React.useState("expenses");
  const [periodFilter, setPeriodFilter] = React.useState<string>("All Periods");
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const openTableCellViewer = (
    item: Category | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Deleting category...",
      success: () => {
        setData((prev) => prev.filter((item) => item.id !== id));
        return "Category deleted successfully";
      },
      error: "Failed to delete category",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedCategories(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const confirmBulkDelete = () => {
    const selectedIds = selectedCategories.map((item) => item.id);

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Deleting ${selectedIds.length} category(s)...`,
      success: () => {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        table.resetRowSelection();
        closeDrawer();
        return `${selectedIds.length} category(s) deleted successfully`;
      },
      error: "Failed to delete categories",
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
    setSelectedCategories([]);
  };

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const columns: ColumnDef<Category>[] = [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
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
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Description
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
      cell: ({ row }) => row.original.description,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "period",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Period
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
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {periodLabels[row.original.period as keyof typeof periodLabels]}
        </Badge>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "transactions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Transactions
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
      cell: ({ row }) => row.original.transactions,
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
      cell: ({ row }) => {
        const amount = row.original.amount;
        return (
          <div
            className={
              row.original.type === "Expense"
                ? "text-destructive"
                : "text-green-500"
            }
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)}
          </div>
        );
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
        const spent = row.original.spent;
        return (
          <div>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(spent)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const amount = row.original.amount;
        const spent = row.original.spent;
        const progress = Math.min(Math.round((spent / amount) * 100), 100);

        return (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 w-full" />
            <span className="text-xs text-muted-foreground w-10">
              {progress}%
            </span>
          </div>
        );
      },
      enableSorting: false,
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
              Edit Category
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
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    let result = data;

    if (activeTab !== "all") {
      result = result.filter((item) =>
        activeTab === "incomes"
          ? item.type === "Income"
          : item.type === "Expense"
      );
    }

    if (periodFilter !== "All Periods") {
      const periodKey = periodFilter
        .toLowerCase()
        .replace(/-/g, "")
        .replace(/ /g, "-");
      result = result.filter((item) => item.period === periodKey);
    }

    return result;
  }, [data, activeTab, periodFilter]);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

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

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Period filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span>{periodFilter}</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setPeriodFilter("All Periods")}>
                All Periods
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(periodLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setPeriodFilter(label)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Category */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTableCellViewer(null, "add")}
          >
            <IconPlus />
            <span className="hidden lg:inline">Add Category</span>
          </Button>

          {/* Delete Selected */}
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
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
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
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
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
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="incomes"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
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
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
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
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
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
}: {
  activeItem: Category | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<Category[]>>;
  selectedCategories?: Category[];
  confirmBulkDelete?: () => void;
}) {
  const isMobile = useIsMobile();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          name: activeItem.name,
          description: activeItem.description,
          period: activeItem.period,
          amount: activeItem.amount.toString(),
          type: activeItem.type,
        }
      : emptyCategoryForm,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        id: activeItem.id,
        name: activeItem.name,
        description: activeItem.description,
        period: activeItem.period,
        amount: activeItem.amount.toString(),
        type: activeItem.type,
      });
    } else {
      form.reset(emptyCategoryForm);
    }
  }, [activeItem, form]);

  const onSubmit = (values: CategoryFormValues) => {
    const newCategory = {
      id: values.id || Date.now(),
      name: values.name,
      description: values.description || "",
      period: values.period,
      transactions: activeItem?.transactions || 0,
      amount: Number.parseFloat(values.amount),
      spent: activeItem?.spent || 0,
      type: values.type,
    };

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: activeItem ? "Updating category..." : "Adding category...",
      success: () => {
        if (activeItem) {
          setData((prev) =>
            prev.map((item) => (item.id === activeItem.id ? newCategory : item))
          );
          return "Category updated successfully";
        } else {
          setData((prev) => [...prev, newCategory]);
          form.reset(emptyCategoryForm);
          return "Category added successfully";
        }
      },
      error: "Failed to save category",
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
              Are you sure you want to delete {selectedCategories.length}{" "}
              category(s)?
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
                          className="text-muted-foreground px-1.5 flex items-center"
                        >
                          {category.type}
                        </Badge>
                      </div>
                      <div
                        className={
                          category.type === "Expense"
                            ? "text-destructive"
                            : "text-emerald-500"
                        }
                      >
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(category.amount)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.description}
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
              ? "Add a new budget category"
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
                        <Input {...field} />
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
                    <FormLabel>Description</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {field.value || "No description provided."}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Period & Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Period</FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md">
                          {
                            periodLabels[
                              field.value as keyof typeof periodLabels
                            ]
                          }
                        </div>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isReadOnly}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semi-annually">
                              Every 6 Months
                            </SelectItem>
                            <SelectItem value="annually">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Type</FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md">
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
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Expense">Expense</SelectItem>
                            <SelectItem value="Income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        }).format(Number.parseFloat(field.value))}
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

              {/* Additional read-only fields for view mode */}
              {isReadOnly && activeItem && (
                <>
                  <div className="flex flex-col gap-3">
                    <Label>Transactions</Label>
                    <div className="p-2 border rounded-md">
                      {activeItem.transactions}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label>Spent</Label>
                    <div className="p-2 border rounded-md">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(activeItem.spent)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label>Progress</Label>
                    <div className="p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(
                            Math.round(
                              (activeItem.spent / activeItem.amount) * 100
                            ),
                            100
                          )}
                          className="h-2 w-full"
                        />
                        <span className="text-xs text-muted-foreground w-10">
                          {Math.min(
                            Math.round(
                              (activeItem.spent / activeItem.amount) * 100
                            ),
                            100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </>
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
