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
  Share2,
  CalendarIcon,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  emptyTransactionForm,
  transactionFormSchema,
  type TransactionFormValues,
  type TransactionWithStats,
} from "@/services/transactions/schema";
import { performSingleItemDelete } from "@/utils/performSingleItemDelete";
import {
  createTransaction,
  createTransactions,
  deleteTransaction,
  deleteTransactions,
  updateTransaction,
} from "../actions";
import { performBulkDelete } from "@/utils/performBulkDelete";
import { getIconBySlug } from "@/utils/getIconBySlug";
import { performAddOrUpdateItem } from "@/utils/performAddOrUpdateItem";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";

export function TransactionsTable({
  data: initialData,
  categories = [],
}: {
  data: TransactionWithStats[];
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
}) {
  const [activeItem, setActiveItem] =
    React.useState<TransactionWithStats | null>(null);
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCsvDropdownOpen, setIsCsvDropdownOpen] = React.useState(false);
  const [categoryFilter, setCategoryFilter] =
    React.useState<string>("All Categories");
  const [descriptionFilter, setDescriptionFilter] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState("all");
  const [data, setData] = React.useState(() => initialData);
  const [selectedTransactions, setSelectedTransactions] = React.useState<
    TransactionWithStats[]
  >([]);
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [csvMode, setCsvMode] = React.useState<"import" | "export" | null>(
    null
  );

  const openTableCellViewer = (
    item: TransactionWithStats | null = null,
    mode: "add" | "edit" | "view" | "delete-confirm" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    await performSingleItemDelete({
      id,
      deleteFn: deleteTransaction,
      setData,
      resourceName: "transaction",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedTransactions(selectedItems);
    openTableCellViewer(null, "delete-confirm");
  };

  const deleteTransactionsBulk = async (ids: string[]) => {
    return deleteTransactions(ids);
  };

  const confirmBulkDelete = async () => {
    await performBulkDelete({
      items: selectedTransactions,
      getId: (item) => item.id,
      deleteFn: deleteTransactionsBulk,
      setData,
      resetSelection: () => table.resetRowSelection(),
      closeDrawer,
      resourceName: "transaction(s)",
    });
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to });
    } else if (range?.from && dateRange?.from && dateRange?.to) {
      setDateRange({ from: range.from, to: undefined });
    } else {
      setDateRange({
        from: range?.from ?? undefined,
        to: range?.to ?? undefined,
      });
    }
  };

  const handleExportCSV = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedTransactions(selectedItems);
    setCsvMode("export");
    setIsDrawerOpen(true);
  };

  const handleImportCSV = () => {
    setCsvMode("import");
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setCsvMode(null);
  };

  const columns: ColumnDef<TransactionWithStats>[] = [
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
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            Date
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
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
      enableSorting: true,
      enableHiding: true,
      sortingFn: "datetime",
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
      cell: ({ row }) => {
        return (
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left"
            onClick={() => openTableCellViewer(row.original, "view")}
          >
            {row.original.description}
          </Button>
        );
      },
      enableHiding: false,
      enableSorting: true,
    },
    {
      accessorFn: (row) => row.category?.name,
      id: "category",
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
      cell: ({ row }) => {
        const amount = row.original.amount;
        const isExpense = row.original.type === "EXPENSE";
        return (
          <div className={isExpense ? "text-destructive" : "text-green-500"}>
            {isExpense ? "-" : "+"}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(Math.abs(amount))}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      sortingFn: "basic",
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
              Edit transaction
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
              onClick={() => handleDeleteTransaction(row.original.id)}
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
        activeTab === "incomes"
          ? item.type === "INCOME"
          : item.type === "EXPENSE"
      );
    }

    if (dateRange.from || dateRange.to) {
      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        const from = dateRange.from;
        const to = dateRange.to;

        return (!from || itemDate >= from) && (!to || itemDate <= to);
      });
    }

    return result;
  }, [data, activeTab, dateRange]);

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

  React.useEffect(() => {
    if (categoryFilter !== "All Categories") {
      table.getColumn("category")?.setFilterValue(categoryFilter);
    } else {
      table.getColumn("category")?.setFilterValue(undefined);
    }

    if (descriptionFilter) {
      table.getColumn("description")?.setFilterValue(descriptionFilter);
    } else {
      table.getColumn("description")?.setFilterValue(undefined);
    }
  }, [table, categoryFilter, descriptionFilter]);

  return (
    <Tabs
      defaultValue="all"
      className="w-full flex-col justify-start gap-6"
      onValueChange={setActiveTab}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>

          <Select defaultValue="all" onValueChange={setActiveTab}>
            <SelectTrigger
              className="w-fit sm:w-40 @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="incomes">Incomes</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
            </SelectContent>
          </Select>

          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="incomes">Incomes</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Description filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="description-filter" className="sr-only">
              Filter by description
            </Label>
            <Input
              id="description-filter"
              placeholder="Filter by description"
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              className="w-40 lg:w-60"
            />
          </div>

          {/* Range picker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[170px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} -{" "}
                      {format(dateRange.to, "LLL dd")}
                    </>
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleRangeSelect}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>

            {dateRange.from || dateRange.to ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
              >
                Clear
              </Button>
            ) : null}
          </div>

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
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => setCategoryFilter(category.name)}
                >
                  <div className="flex items-center">
                    {getIconBySlug(category.icon)}
                    {category.name}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/categories")}
              >
                <Plus />
                Add new category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CSV Import/Export */}
          <DropdownMenu
            open={isCsvDropdownOpen}
            onOpenChange={setIsCsvDropdownOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Import/Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  setIsCsvDropdownOpen(false);
                  setTimeout(() => handleImportCSV(), 0);
                }}
              >
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!hasSelectedRows}
                onClick={() => {
                  setIsCsvDropdownOpen(false);
                  setTimeout(() => handleExportCSV(), 0);
                }}
              >
                Export Selected to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTableCellViewer(null, "add")}
          >
            <IconPlus />
            <span className="hidden lg:inline">Add transaction</span>
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
        value="all"
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
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                    No income transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                    No expense transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        selectedTransactions={selectedTransactions}
        confirmBulkDelete={confirmBulkDelete}
        csvMode={csvMode}
        setCsvMode={setCsvMode}
        categories={categories}
        activeTab={activeTab}
      />
    </Tabs>
  );
}

// CSV utility functions
function generateCSV(transactions: TransactionWithStats[]) {
  // Headers
  const headers = [
    "date",
    "description",
    "amount",
    "category",
    "type",
    "notes",
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map((transaction) => {
    return [
      transaction.date,
      `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in CSV
      transaction.amount,
      transaction.category?.name,
      transaction.type,
      `"${(transaction.notes || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
    ].join(",");
  });

  // Combine headers and rows
  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function TableCellViewer({
  activeItem,
  viewMode,
  isDrawerOpen,
  setIsDrawerOpen,
  closeDrawer,
  setData,
  selectedTransactions = [],
  confirmBulkDelete,
  csvMode,
  setCsvMode,
  categories = [],
  activeTab,
}: {
  activeItem: TransactionWithStats | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<TransactionWithStats[]>>;
  selectedTransactions?: TransactionWithStats[];
  confirmBulkDelete?: () => void;
  csvMode: "import" | "export" | null;
  setCsvMode: React.Dispatch<React.SetStateAction<"import" | "export" | null>>;
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
  activeTab: string;
}) {
  const isMobile = useIsMobile();
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [csvData, setCsvData] = React.useState<TransactionFormValues[]>([]);
  const [csvErrors, setCsvErrors] = React.useState<string[]>([]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          date: activeItem.date,
          description: activeItem.description,
          amount: activeItem.amount.toString(),
          categoryId: activeItem.categoryId,
          type: activeItem.type as "Income" | "Expense",
          notes: activeItem.notes || "",
        }
      : {
          ...emptyTransactionForm,
          type:
            activeTab === "expenses" || activeTab === "all"
              ? "Expense"
              : "Income",
        },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        id: activeItem.id,
        date: activeItem.date,
        description: activeItem.description,
        amount: activeItem.amount.toString(),
        categoryId: activeItem.categoryId,
        type: activeItem.type === "INCOME" ? "Income" : "Expense",
        notes: activeItem.notes || "",
      });
    } else {
      form.reset({
        ...emptyTransactionForm,
        type:
          activeTab === "expenses" || activeTab === "all"
            ? "Expense"
            : "Income",
      });
    }
  }, [activeItem, form, activeTab]);

  const onSubmit = async (values: TransactionFormValues) => {
    const formData = new FormData();
    formData.append("date", values.date);
    formData.append("description", values.description);
    formData.append("amount", values.amount);
    formData.append("categoryId", values.categoryId);
    formData.append("type", values.type);
    formData.append("notes", values.notes || "");

    if (activeItem) formData.append("id", activeItem.id);

    await performAddOrUpdateItem({
      formData,
      isEdit: !!activeItem,
      createFn: createTransaction,
      updateFn: updateTransaction,
      setData,
      closeDrawer,
      resetForm: form.reset,
      resourceName: "transaction",
    });
  };

  const getCategoryIdByNameAndType = (
    name: string,
    type: "INCOME" | "EXPENSE"
  ) => {
    const expectedType = type === "INCOME" ? "INCOME" : "EXPENSE";

    return (
      categories.find(
        (c) =>
          c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          c.type === expectedType
      )?.id || ""
    );
  };

  const isReadOnly = viewMode === "view";
  const isDeleteConfirm = viewMode === "delete-confirm";

  if (csvMode === "import") {
    return (
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setCsvMode(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Import Transactions</DrawerTitle>
            <DrawerDescription>
              Upload a CSV file to import transactions
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <Label htmlFor="csv-file" className="mb-2 block">
                Select CSV file
              </Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCsvFile(file);
                  setCsvData([]);
                  setCsvErrors([]);
                }}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                The CSV file should have the following columns: date,
                description, amount, category, type, notes (optional)
              </p>
            </div>

            {csvErrors.length > 0 && (
              <div className="rounded-md border p-4 text-sm text-destructive">
                <strong>Validation Errors:</strong>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {csvErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {csvErrors.length > 5 && (
                    <li>...and {csvErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Show format instructions if data not yet valid */}
            {!(csvData.length > 0 && csvErrors.length === 0) && (
              <div className="rounded-md border p-4 bg-muted/30">
                <h3 className="font-medium mb-2">CSV Format Requirements:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>First row must be headers</li>
                  <li>
                    Required columns: date, description, amount, category, type
                  </li>
                  <li>Date format: YYYY-MM-DD</li>
                  <li>Type must be either "Income" or "Expense"</li>
                  <li>Amount should be a positive number</li>
                </ul>
              </div>
            )}

            {csvData.length > 0 && csvErrors.length === 0 && (
              <>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Ready to import <strong>{csvData.length}</strong>{" "}
                    transactions.
                  </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto border rounded-md text-sm">
                  <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{t.date}</TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell>{t.amount}</TableCell>
                          <TableCell>{t.type}</TableCell>
                          <TableCell>
                            {categories.find((c) => c.id === t.categoryId)
                              ?.name || "—"}
                          </TableCell>
                          <TableCell>{t.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <DrawerFooter>
            {csvData.length > 0 && csvErrors.length === 0 ? (
              <Button
                onClick={async () => {
                  const formDataList = csvData.map((row) => {
                    const formData = new FormData();
                    formData.append("date", row.date);
                    formData.append("description", row.description);
                    formData.append("amount", row.amount);
                    formData.append("categoryId", row.categoryId);
                    formData.append("type", row.type);
                    formData.append("notes", row.notes || "");
                    return formData;
                  });

                  const res = await createTransactions(formDataList);

                  if (res.success) {
                    toast.success(
                      `Imported ${res.data.successful} / ${res.data.total} transactions`
                    );
                    setData((prev) => [
                      ...prev,
                      ...res.data.results
                        .filter((r) => r.success)
                        .map((r) => r.data),
                    ]);
                    setCsvMode(null);
                    setIsDrawerOpen(false);
                  } else {
                    toast.error(res.error || "Failed to import transactions");
                  }
                }}
              >
                Import CSV
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!csvFile) {
                    toast.error("Please select a CSV file.");
                    return;
                  }

                  Papa.parse(csvFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                      const parsed = results.data as any[];
                      const errors: string[] = [];
                      const valid: TransactionFormValues[] = [];

                      parsed.forEach((row, i) => {
                        const rowNum = i + 2;
                        const rawType = row.type?.trim();
                        const type = rawType?.toUpperCase();
                        const amount = parseFloat(row.amount);
                        const date = row.date?.trim();
                        const categoryId = getCategoryIdByNameAndType(
                          row.category,
                          type
                        );

                        if (!date || isNaN(Date.parse(date))) {
                          errors.push(`Row ${rowNum}: Invalid or missing date`);
                        }
                        if (!row.description?.trim()) {
                          errors.push(`Row ${rowNum}: Missing description`);
                        }
                        if (!row.category?.trim()) {
                          errors.push(`Row ${rowNum}: Missing category`);
                        } else if (!categoryId) {
                          errors.push(
                            `Row ${rowNum}: Category not found or mismatched type`
                          );
                        }
                        if (!type || !["INCOME", "EXPENSE"].includes(type)) {
                          errors.push(
                            `Row ${rowNum}: Type must be "INCOME" or "EXPENSE"`
                          );
                        }
                        if (!amount || amount <= 0 || isNaN(amount)) {
                          errors.push(`Row ${rowNum}: Invalid amount`);
                        }

                        if (errors.length === 0) {
                          valid.push({
                            id: undefined,
                            date,
                            description: row.description.trim(),
                            amount: row.amount.trim(),
                            categoryId,
                            type: type === "INCOME" ? "Income" : "Expense",
                            notes: row.notes?.trim() || "",
                          });
                        }
                      });

                      setCsvErrors(errors);
                      setCsvData(valid);

                      if (errors.length > 0) {
                        toast.error(`CSV has ${errors.length} error(s).`);
                      } else {
                        toast.success(
                          `Validated ${valid.length} transaction(s)!`
                        );
                      }
                    },
                    error: (err) => {
                      console.error(err);
                      toast.error("Error parsing CSV file.");
                    },
                  });
                }}
              >
                Validate CSV
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCsvMode(null);
                closeDrawer();
              }}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  if (csvMode === "export") {
    return (
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setCsvMode(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Export Transactions</DrawerTitle>
            <DrawerDescription>
              Export selected transactions to CSV
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Export Summary:</h3>
              <p>
                You are about to export{" "}
                <span className="font-semibold">
                  {selectedTransactions.length}
                </span>{" "}
                transaction(s) to CSV.
              </p>
            </div>
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell
                        className={
                          transaction.type === "EXPENSE"
                            ? "text-destructive"
                            : "text-green-500"
                        }
                      >
                        {transaction.type === "EXPENSE" ? "-" : "+"}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-muted-foreground text-sm">
              The CSV file will include all data for the selected transactions,
              including date, description, amount, category, type, and notes.
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                // In a real implementation, this would generate and download the CSV
                const csvContent = generateCSV(selectedTransactions);
                downloadCSV(csvContent, "transactions.csv");
                toast.success(
                  `${selectedTransactions.length} transactions exported successfully!`
                );
                if (setCsvMode) setCsvMode(null);
                closeDrawer();
              }}
            >
              Download CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCsvMode(null);
                closeDrawer();
              }}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

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
              Are you sure you want to delete {selectedTransactions.length}{" "}
              transaction(s)?
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Selected transactions:</h3>
              <div className="max-h-[300px] overflow-y-auto">
                {selectedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="py-2 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {transaction.description}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground px-1.5 flex items-center"
                        >
                          {transaction.category?.icon &&
                            getIconBySlug(transaction.category.icon)}
                          {transaction.category?.name}
                        </Badge>
                      </div>
                      <div
                        className={
                          transaction.type === "EXPENSE"
                            ? "text-destructive"
                            : "text-emerald-500"
                        }
                      >
                        {transaction.type === "EXPENSE" ? "-" : "+"}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Math.abs(transaction.amount))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              This action cannot be undone. These transactions will be
              permanently deleted.
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
              ? "Add Transaction"
              : viewMode === "edit"
              ? "Edit Transaction"
              : "Transaction Details"}
          </DrawerTitle>
          <DrawerDescription>
            {viewMode === "add"
              ? "Add a new transaction to your records"
              : viewMode === "edit"
              ? "Update transaction information"
              : "View transaction details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Form {...form}>
            <form
              id="transaction-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Date</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {format(new Date(field.value), "PPP")}
                      </div>
                    ) : (
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 pointer-events-auto"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : ""
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
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
                      <div className="p-2 border rounded-md">{field.value}</div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="e.g., Sushi with John" />
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
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(() => {
                            const selectedType = form.watch("type");
                            const expectedCategoryType =
                              selectedType === "Income" ? "INCOME" : "EXPENSE";
                            const filteredCategories = categories.filter(
                              (category) =>
                                category.type === expectedCategoryType
                            );

                            return (
                              <>
                                {filteredCategories.length === 0 && (
                                  <div className="px-4 py-2 text-muted-foreground text-sm italic">
                                    No {selectedType.toLowerCase()} categories
                                    available
                                  </div>
                                )}
                                {filteredCategories.map((category) => (
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

              {/* Amount & Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => {
                    const type = form.watch("type");
                    const isExpense = type?.toUpperCase() === "EXPENSE";

                    return (
                      <FormItem className="flex flex-col gap-3">
                        <FormLabel>Amount</FormLabel>
                        {isReadOnly ? (
                          <div
                            className={cn(
                              "p-2 border rounded-md",
                              isExpense ? "text-destructive" : "text-green-500"
                            )}
                          >
                            {isExpense ? "-" : "+"}
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Math.abs(Number(field.value)))}
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
                    );
                  }}
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

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Notes (optional)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md min-h-[80px]">
                        {field.value || "N/A"}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="Transaction notes..." />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" form="transaction-form">
                {activeItem ? "Update Transaction" : "Add Transaction"}
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
