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
  Building,
  Wallet,
  Landmark,
  Briefcase,
  TrendingUp,
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

export const accountSchema = z.object({
  id: z.number(),
  accountName: z.string(),
  institution: z.string(),
  category: z.string(),
  expectedRate: z.number(),
  balance: z.number(),
  growth: z.number(),
  type: z.enum(["Savings", "Investment"]),
});

export type Account = z.infer<typeof accountSchema>;

const accountFormSchema = z.object({
  id: z.number().optional(),
  accountName: z.string().min(1, "Account name is required"),
  institution: z.string().min(1, "Institution is required"),
  category: z.string().min(1, "Category is required"),
  expectedRate: z.string().min(1, "Expected rate is required"),
  balance: z.string().min(1, "Balance is required"),
  type: z.enum(["Savings", "Investment"]),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const emptyAccountForm: AccountFormValues = {
  accountName: "",
  institution: "",
  category: "",
  expectedRate: "",
  balance: "",
  type: "Savings",
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Bank Account":
      return <Landmark className="mr-2 h-4 w-4" />;
    case "Retirement":
      return <Briefcase className="mr-2 h-4 w-4" />;
    case "Brokerage":
      return <TrendingUp className="mr-2 h-4 w-4" />;
    case "Cash":
      return <Wallet className="mr-2 h-4 w-4" />;
    default:
      return <Building className="mr-2 h-4 w-4" />;
  }
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

function DraggableRow({ row }: { row: Row<Account> }) {
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

export function SavingsTable({ data: initialData }: { data: Account[] }) {
  const [activeItem, setActiveItem] = React.useState<Account | null>(null);
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [data, setData] = React.useState(() => initialData);
  const [selectedAccounts, setSelectedAccounts] = React.useState<Account[]>([]);
  const [activeTab, setActiveTab] = React.useState("savings");
  const [categoryFilter, setCategoryFilter] =
    React.useState<string>("All Categories");
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const openTableCellViewer = (
    item: Account | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteAccount = (id: number) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Deleting account...",
      success: () => {
        setData((prev) => prev.filter((item) => item.id !== id));
        return "Account deleted successfully";
      },
      error: "Failed to delete account",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedAccounts(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const confirmBulkDelete = () => {
    const selectedIds = selectedAccounts.map((item) => item.id);

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Deleting ${selectedIds.length} account(s)...`,
      success: () => {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        table.resetRowSelection();
        closeDrawer();
        return `${selectedIds.length} account(s) deleted successfully`;
      },
      error: "Failed to delete accounts",
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
    setSelectedAccounts([]);
  };

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const columns: ColumnDef<Account>[] = [
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
      accessorKey: "accountName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Account Name
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
            {row.original.accountName}
          </Button>
        );
      },
      enableHiding: false,
      enableSorting: true,
    },
    {
      accessorKey: "institution",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Institution
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
      cell: ({ row }) => <div>{row.original.institution}</div>,
      enableSorting: true,
      enableHiding: true,
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
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5 flex items-center"
        >
          {getCategoryIcon(row.original.category)}
          {row.original.category}
        </Badge>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "expectedRate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Expected Rate
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
      cell: ({ row }) => <div>{row.original.expectedRate.toFixed(2)}%</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "balance",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Balance
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
        const balance = row.original.balance;
        return (
          <div>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(balance)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "growth",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Growth
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
        const growth = row.original.growth;
        const isPositive = growth >= 0;
        return (
          <div className={isPositive ? "text-green-500" : "text-destructive"}>
            {isPositive ? "+" : ""}
            {growth.toFixed(2)}%
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
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDeleteAccount(row.original.id)}
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

    if (activeTab !== "all") {
      result = result.filter((item) =>
        activeTab === "investments"
          ? item.type === "Investment"
          : item.type === "Savings"
      );
    }

    if (categoryFilter !== "All Categories") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [data, activeTab, categoryFilter]);

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
      defaultValue="savings"
      className="w-full flex-col justify-start gap-6"
      onValueChange={setActiveTab}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>

          <Select defaultValue="savings" onValueChange={setActiveTab}>
            <SelectTrigger
              className="w-fit sm:w-40 @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="investments">Investments</SelectItem>
            </SelectContent>
          </Select>

          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
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

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span>{categoryFilter}</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => setCategoryFilter("All Categories")}
              >
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Array.from(new Set(data.map((item) => item.category))).map(
                (category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                  >
                    <div className="flex items-center">
                      {getCategoryIcon(category)}
                      {category}
                    </div>
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Account */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTableCellViewer(null, "add")}
          >
            <IconPlus />
            <span className="hidden lg:inline">Add Account</span>
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
        value="savings"
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
                      No savings accounts found.
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
        value="investments"
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
                      No investment accounts found.
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
        selectedAccounts={selectedAccounts}
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
  selectedAccounts = [],
  confirmBulkDelete,
}: {
  activeItem: Account | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<Account[]>>;
  selectedAccounts?: Account[];
  confirmBulkDelete?: () => void;
}) {
  const isMobile = useIsMobile();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          accountName: activeItem.accountName,
          institution: activeItem.institution,
          category: activeItem.category,
          expectedRate: activeItem.expectedRate.toString(),
          balance: activeItem.balance.toString(),
          type: activeItem.type,
        }
      : emptyAccountForm,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        id: activeItem.id,
        accountName: activeItem.accountName,
        institution: activeItem.institution,
        category: activeItem.category,
        expectedRate: activeItem.expectedRate.toString(),
        balance: activeItem.balance.toString(),
        type: activeItem.type,
      });
    } else {
      form.reset(emptyAccountForm);
    }
  }, [activeItem, form]);

  const onSubmit = (values: AccountFormValues) => {
    const newAccount = {
      id: values.id || Date.now(),
      accountName: values.accountName,
      institution: values.institution,
      category: values.category,
      expectedRate: Number.parseFloat(values.expectedRate),
      balance: Number.parseFloat(values.balance),
      growth: activeItem?.growth || 0,
      type: values.type,
    };

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: activeItem ? "Updating account..." : "Adding account...",
      success: () => {
        if (activeItem) {
          setData((prev) =>
            prev.map((item) => (item.id === activeItem.id ? newAccount : item))
          );
          return "Account updated successfully";
        } else {
          setData((prev) => [...prev, newAccount]);
          form.reset(emptyAccountForm);
          return "Account added successfully";
        }
      },
      error: "Failed to save account",
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
              Are you sure you want to delete {selectedAccounts.length}{" "}
              account(s)?
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Selected accounts:</h3>
              <div className="max-h-[300px] overflow-y-auto">
                {selectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {account.accountName}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground px-1.5 flex items-center"
                        >
                          {account.type}
                        </Badge>
                      </div>
                      <div>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(account.balance)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.institution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              This action cannot be undone. These accounts will be permanently
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
              ? "Add Account"
              : viewMode === "edit"
              ? "Edit Account"
              : "Account Details"}
          </DrawerTitle>
          <DrawerDescription>
            {viewMode === "add"
              ? "Add a new savings or investment account"
              : viewMode === "edit"
              ? "Update account information"
              : "View account details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Form {...form}>
            <form
              id="account-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Account Name */}
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Account Name</FormLabel>
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

              {/* Institution */}
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Institution</FormLabel>
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

              {/* Category & Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Category</FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md flex items-center">
                          {getCategoryIcon(field.value)}
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
                            <SelectItem value="Bank Account">
                              <div className="flex items-center">
                                <Landmark className="mr-2 h-4 w-4" />
                                Bank Account
                              </div>
                            </SelectItem>
                            <SelectItem value="Retirement">
                              <div className="flex items-center">
                                <Briefcase className="mr-2 h-4 w-4" />
                                Retirement
                              </div>
                            </SelectItem>
                            <SelectItem value="Brokerage">
                              <div className="flex items-center">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Brokerage
                              </div>
                            </SelectItem>
                            <SelectItem value="Cash">
                              <div className="flex items-center">
                                <Wallet className="mr-2 h-4 w-4" />
                                Cash
                              </div>
                            </SelectItem>
                            <SelectItem value="Other">
                              <div className="flex items-center">
                                <Building className="mr-2 h-4 w-4" />
                                Other
                              </div>
                            </SelectItem>
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
                            <SelectItem value="Savings">Savings</SelectItem>
                            <SelectItem value="Investment">
                              Investment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Expected Rate */}
              <FormField
                control={form.control}
                name="expectedRate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Expected Rate (%)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {Number.parseFloat(field.value).toFixed(2)}%
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min={0} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Balance */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Balance</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number.parseFloat(field.value))}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min={0} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional read-only fields for view mode */}
              {isReadOnly && activeItem && (
                <div className="flex flex-col gap-3">
                  <Label>Growth</Label>
                  <div className="p-2 border rounded-md">
                    <span
                      className={
                        activeItem.growth >= 0
                          ? "text-green-500"
                          : "text-destructive"
                      }
                    >
                      {activeItem.growth >= 0 ? "+" : ""}
                      {activeItem.growth.toFixed(2)}%
                    </span>
                  </div>
                </div>
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
              <Button type="submit" form="account-form">
                {activeItem ? "Update Account" : "Add Account"}
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
