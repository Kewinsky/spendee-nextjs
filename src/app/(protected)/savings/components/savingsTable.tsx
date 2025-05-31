"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import {
  TrendingUp,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  PiggyBank,
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

// Import the proper schemas and types
import {
  savingsFormSchema,
  type SavingsFormValues,
  type SavingsWithStats,
  type AccountType,
  emptySavingsForm,
} from "@/services/savings/schema";
import {
  createSavings,
  updateSavings,
  deleteSaving,
  deleteSavings,
} from "../actions";
import { formatCurrency, formatPercentage } from "@/utils/formatting";
import { performBulkDelete } from "@/utils/performBulkDelete";
import { performSingleItemDelete } from "@/utils/performSingleItemDelete";
import { performAddOrUpdateItem } from "@/utils/performAddOrUpdateItem";
import { getIconBySlug } from "@/utils/getIconBySlug";

const getAccountTypeIcon = (accountType: AccountType) => {
  switch (accountType) {
    case "SAVINGS":
      return <PiggyBank className="mr-2 h-4 w-4" />;
    case "INVESTMENT":
      return <TrendingUp className="mr-2 h-4 w-4" />;
  }
};

export function SavingsTable({
  data: initialData,
  categories = [],
  usedCategoryIds = [],
}: {
  data: SavingsWithStats[];
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
  usedCategoryIds?: string[];
}) {
  const [activeItem, setActiveItem] = React.useState<SavingsWithStats | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<
    "add" | "edit" | "view" | "delete-confirm"
  >("add");
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [data, setData] = React.useState<SavingsWithStats[]>(() => initialData);
  const [categoryFilter, setCategoryFilter] =
    React.useState<string>("All Categories");
  const [selectedAccounts, setSelectedAccounts] = React.useState<
    SavingsWithStats[]
  >([]);
  const [activeTab, setActiveTab] = React.useState("savings");

  const filteredData = React.useMemo(() => {
    let result = data;

    if (activeTab !== "all") {
      result = result.filter((item) =>
        activeTab === "investments"
          ? item.accountType === "INVESTMENT"
          : item.accountType === "SAVINGS"
      );
    }

    return result;
  }, [data, activeTab]);

  const openTableCellViewer = (
    item: SavingsWithStats | null,
    mode: "add" | "edit" | "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleDeleteAccount = async (id: string) => {
    await performSingleItemDelete({
      id,
      deleteFn: deleteSaving,
      setData,
      resourceName: "account",
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    setSelectedAccounts(selectedItems);
    setViewMode("delete-confirm");
    setIsDrawerOpen(true);
  };

  const deleteAccountsBulk = async (ids: string[]) => {
    return Promise.all(ids.map((id) => deleteSavings(id)));
  };

  const confirmBulkDelete = async () => {
    await performBulkDelete({
      items: selectedAccounts,
      getId: (item) => item.id,
      deleteFn: deleteAccountsBulk,
      setData,
      resetSelection: () => table.resetRowSelection(),
      closeDrawer,
      resourceName: "account(s)",
    });
  };

  const columns: ColumnDef<SavingsWithStats>[] = [
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
      cell: ({ row }) => <div>{row.original.institution || "N/A"}</div>,
      enableSorting: true,
      enableHiding: true,
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
      accessorKey: "interestRate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 p-0!"
          >
            {activeTab === "investments" ? "Expected Return" : "Interest Rate"}
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
      cell: ({ row }) => formatPercentage(row.original.interestRate),
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
      cell: ({ row }) => formatCurrency(row.original.balance),
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
        return (
          <div className="flex items-center gap-2">
            <span className={growth >= 0 ? "text-emerald-600" : "text-red-600"}>
              {growth >= 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </span>
            <span>{formatPercentage(growth)}</span>
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
              Edit account
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
    const map = new Map<string, { name: string; icon: string }>();

    data.forEach((item) => {
      const category = item.category;
      if (category && !map.has(category.name)) {
        map.set(category.name, { name: category.name, icon: category.icon });
      }
    });

    return Array.from(map.values());
  }, [data]);

  React.useEffect(() => {
    if (categoryFilter !== "All Categories") {
      table.getColumn("category")?.setFilterValue(categoryFilter);
    } else {
      table.getColumn("category")?.setFilterValue(undefined);
    }
  }, [table, categoryFilter]);

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
              {uniqueCategories.map((category) => (
                <DropdownMenuItem
                  key={category?.name}
                  onClick={() => setCategoryFilter(category?.name)}
                >
                  <div className="flex items-center">
                    {getIconBySlug(category?.icon)}
                    {category?.name}
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
                    No savings accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent
        value="investments"
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
                    No investment accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <SavingsTableCellViewer
        activeItem={activeItem}
        viewMode={viewMode}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        closeDrawer={closeDrawer}
        setData={setData}
        selectedAccounts={selectedAccounts}
        confirmBulkDelete={confirmBulkDelete}
        activeTab={activeTab}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
      />
    </Tabs>
  );
}

function SavingsTableCellViewer({
  activeItem,
  viewMode,
  isDrawerOpen,
  setIsDrawerOpen,
  closeDrawer,
  setData,
  selectedAccounts = [],
  confirmBulkDelete,
  activeTab,
  categories = [],
  usedCategoryIds = [],
}: {
  activeItem: SavingsWithStats | null;
  viewMode: "add" | "edit" | "view" | "delete-confirm";
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeDrawer: () => void;
  setData: React.Dispatch<React.SetStateAction<SavingsWithStats[]>>;
  selectedAccounts?: SavingsWithStats[];
  confirmBulkDelete?: () => void;
  activeTab?: string;
  categories?: {
    id: string;
    name: string;
    type: "EXPENSE" | "INCOME";
    icon: string;
  }[];
  usedCategoryIds?: string[];
}) {
  const isMobile = useIsMobile();

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(savingsFormSchema),
    defaultValues: activeItem
      ? {
          accountName: activeItem.accountName,
          categoryId: activeItem.categoryId,
          balance: activeItem.balance.toString(),
          interestRate: activeItem.interestRate.toString(),
          growth: activeItem.growth.toString(),
          accountType: activeItem.accountType,
          institution: activeItem.institution || "",
        }
      : {
          ...emptySavingsForm,
          accountType: activeTab === "investments" ? "INVESTMENT" : "SAVINGS",
        },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (activeItem) {
      form.reset({
        accountName: activeItem.accountName,
        categoryId: activeItem.categoryId,
        balance: activeItem.balance.toString(),
        interestRate: activeItem.interestRate.toString(),
        growth: activeItem.growth.toString(),
        accountType: activeItem.accountType,
        institution: activeItem.institution || "",
      });
    } else {
      form.reset({
        ...emptySavingsForm,
        accountType: activeTab === "investments" ? "INVESTMENT" : "SAVINGS",
      });
    }
  }, [activeItem, form, activeTab]);

  const onSubmit = async (values: SavingsFormValues) => {
    const formData = new FormData();
    formData.append("accountName", values.accountName);
    formData.append("categoryId", values.categoryId);
    formData.append("balance", values.balance);
    formData.append("interestRate", values.interestRate);
    formData.append("growth", values.growth || "0");
    formData.append("accountType", values.accountType);
    formData.append("institution", values.institution || "");

    if (activeItem) {
      formData.append("id", activeItem.id);
    }

    await performAddOrUpdateItem({
      formData,
      isEdit: !!activeItem,
      createFn: createSavings,
      updateFn: updateSavings,
      setData,
      closeDrawer,
      resetForm: form.reset,
      resourceName: "account",
    });
  };

  const isReadOnly = viewMode === "view";
  const isDeleteConfirm = viewMode === "delete-confirm";
  const isSavings = form.watch("accountType") === "SAVINGS";

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
                          {account.accountType}
                        </Badge>
                      </div>
                      <div>{formatCurrency(account.balance)}</div>
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
                        <Input {...field} placeholder="e.g., Emergency Fund" />
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
                    <FormLabel>Institution (optional)</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md">
                        {field.value || "N/A"}
                      </div>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="e.g., Chase Bank" />
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
                                cat.type === "INCOME" &&
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

              {/* Account Type */}
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Account Type</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md flex items-center">
                        {getAccountTypeIcon(field.value)}
                        {field.value === "SAVINGS" ? "Savings" : "Investing"}
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SAVINGS">
                            <div className="flex items-center">
                              <PiggyBank className="mr-2 h-4 w-4" />
                              Savings
                            </div>
                          </SelectItem>
                          <SelectItem value="INVESTMENT">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Investment
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Balance & Interest Rate */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Balance</FormLabel>
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
                            min={0}
                            placeholder="0.00"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>
                        {isSavings
                          ? "Interest Rate (%)"
                          : "Expected Return (%)"}
                      </FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md">
                          {formatPercentage(Number.parseFloat(field.value))}
                        </div>
                      ) : (
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Growth */}
              {isReadOnly && (
                <FormField
                  control={form.control}
                  name="growth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-3">
                      <FormLabel>Growth Rate (%)</FormLabel>
                      {isReadOnly ? (
                        <div className="p-2 border rounded-md flex items-center gap-2">
                          <span
                            className={
                              Number.parseFloat(field.value) >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {Number.parseFloat(field.value) >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                          </span>
                          <span>
                            {formatPercentage(Number.parseFloat(field.value))}
                          </span>
                        </div>
                      ) : (
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
