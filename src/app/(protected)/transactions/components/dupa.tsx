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
  deleteTransaction,
  deleteTransactions,
  updateTransaction,
} from "../actions";
import { performBulkDelete } from "@/utils/performBulkDelete";
import { getIconBySlug } from "@/utils/getIconBySlug";
import { performAddOrUpdateItem } from "@/utils/performAddOrUpdateItem";

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
    return Promise.all(ids.map((id) => deleteTransactions(id)));
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category!;

        return (
          <Badge
            variant="outline"
            className="text-muted-foreground px-1.5 flex items-center"
          >
            {getIconBySlug(category.icon)}
            {category.name}
          </Badge>
        );
      },
      enableHiding: true,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.type === "INCOME"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              : "bg-red-100 text-destructive dark:bg-red-900 dark:text-red-200"
          }
        >
          {row.original.type}
        </Badge>
      ),
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

  // Get unique categories from data for the filter dropdown
  const uniqueCategories = React.useMemo(() => {
    const categoryMap = new Map();

    data.forEach((item) => {
      if (item.category && !categoryMap.has(item.category.id)) {
        categoryMap.set(item.category.id, item.category);
      }
    });

    return Array.from(categoryMap.values());
  }, [data]);

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
              {uniqueCategories.map((category) => (
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
      transaction.category,
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
}) {
  const isMobile = useIsMobile();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          date: activeItem.date,
          description: activeItem.description,
          amount: activeItem.amount.toString(),
          category: activeItem.category,
          type: activeItem.type as "Income" | "Expense",
          notes: activeItem.notes || "",
        }
      : emptyTransactionForm,
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
      form.reset(emptyTransactionForm);
    }
  }, [activeItem, form]);

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

  const isReadOnly = viewMode === "view";
  const isDeleteConfirm = viewMode === "delete-confirm";

  if (csvMode === "import") {
    return (
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
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
              />
              <p className="mt-2 text-sm text-muted-foreground">
                The CSV file should have the following columns: date,
                description, amount, category, type, notes (optional)
              </p>
            </div>
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
            <div className="text-muted-foreground text-sm">
              Note: Importing will validate your data before adding it to your
              transactions.
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                toast.success(
                  "CSV validation successful! Ready to import 0 transactions."
                );
                // In a real implementation, this would parse and validate the CSV
              }}
            >
              Validate CSV
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

  if (csvMode === "export") {
    return (
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
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
                      <Popover>
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
                        <PopoverContent className="w-auto p-0">
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
                            initialFocus
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
                        <Input {...field} />
                      </FormControl>
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
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Amount</FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(field.value))}
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
                            <SelectItem value="Income">Income</SelectItem>
                            <SelectItem value="Expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center">
                                {getIconBySlug(category.icon)}
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Notes (Optional)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md min-h-[80px]">
                        {field.value || "No notes provided."}
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
