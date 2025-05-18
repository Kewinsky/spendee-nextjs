"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  IconChevronDown,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  Trash2,
  CalendarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getIconBySlug } from "@/utils/getIconBySlug";
import { TransactionDrawer } from "./transaction-drawer";

// Import sample data
import transactionsData from "./transactions-data.json";
import { TableWrapper } from "@/components/table/table-wrapper";
import { TableHeader } from "@/components/table/table-header";
import { DeleteConfirmation } from "@/components/table/delete-confirmation";
import { Transaction } from "../transaction-schema";

export default function Dupa() {
  const [data, setData] = useState<Transaction[]>(transactionsData);
  const [activeItem, setActiveItem] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<"add" | "edit" | "view">("add");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<
    Transaction[]
  >([]);
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState<string>("All Categories");
  const [descriptionFilter, setDescriptionFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const openDrawer = (
    item: Transaction | null = null,
    mode: "add" | "edit" | "view" = "view"
  ) => {
    setActiveItem(item);
    setViewMode(mode);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
  };

  const handleDeleteTransaction = (id: number) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Deleting transaction...",
      success: () => {
        setData((prev) => prev.filter((item) => item.id !== id));
        return "Transaction deleted successfully";
      },
      error: "Failed to delete transaction",
    });
  };

  const handleBulkDelete = (selectedRows: Transaction[]) => {
    setSelectedTransactions(selectedRows);
    setIsDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = () => {
    const selectedIds = selectedTransactions.map((item) => item.id);

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Deleting ${selectedIds.length} transaction(s)...`,
      success: () => {
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        setIsDeleteConfirmOpen(false);
        return `${selectedIds.length} transaction(s) deleted successfully`;
      },
      error: "Failed to delete transactions",
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

  // Get unique categories from data for the filter dropdown
  const uniqueCategories = Array.from(
    new Set(data.map((item) => item.category))
  );

  const filteredData = data.filter((item) => {
    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "incomes" && item.type !== "Income") return false;
      if (activeTab === "expenses" && item.type !== "Expense") return false;
    }

    // Filter by category
    if (
      categoryFilter !== "All Categories" &&
      item.category !== categoryFilter
    ) {
      return false;
    }

    // Filter by description
    if (
      descriptionFilter &&
      !item.description.toLowerCase().includes(descriptionFilter.toLowerCase())
    ) {
      return false;
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      const itemDate = new Date(item.date);
      if (dateRange.from && itemDate < dateRange.from) return false;
      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }
    }

    return true;
  });

  const columns = [
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
            onClick={() => openDrawer(row.original, "view")}
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
        const isExpense = row.original.type === "Expense";
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
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="text-muted-foreground px-1.5 flex items-center"
        >
          {getIconBySlug(row.original.icon)}
          {row.original.category}
        </Badge>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.type === "Income"
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
            <DropdownMenuItem onClick={() => openDrawer(row.original, "edit")}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDrawer(row.original, "view")}>
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

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="all"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="incomes">Incomes</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
        </div>

        <TableWrapper
          columns={columns}
          data={filteredData}
          getRowId={(row) => row.id.toString()}
          emptyMessage={`No ${
            activeTab === "all" ? "" : activeTab
          } transactions found.`}
        >
          <TableHeader table={null}>
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

                {(dateRange.from || dateRange.to) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDateRange({ from: undefined, to: undefined })
                    }
                  >
                    Clear
                  </Button>
                )}
              </div>

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
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                    >
                      <div className="flex items-center">
                        {getIconBySlug(
                          data.find((item) => item.category === category)
                            ?.icon || "Package"
                        )}
                        {category}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Transaction */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDrawer(null, "add")}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>

              {/* Delete Selected */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const selectedRows = data.filter((_, index) =>
                    Object.keys(
                      document.querySelectorAll(
                        'input[type="checkbox"]:checked'
                      )
                    ).includes(index.toString())
                  );
                  if (selectedRows.length > 0) {
                    handleBulkDelete(selectedRows);
                  }
                }}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected</span>
              </Button>
            </div>
          </TableHeader>
        </TableWrapper>
      </Tabs>

      <TransactionDrawer
        activeItem={activeItem}
        viewMode={viewMode}
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        onClose={closeDrawer}
        onSave={(transaction) => {
          if (viewMode === "add") {
            setData([...data, { ...transaction, id: Date.now() }]);
          } else if (viewMode === "edit" && activeItem) {
            setData(
              data.map((item) =>
                item.id === activeItem.id
                  ? { ...transaction, id: activeItem.id }
                  : item
              )
            );
          }
          closeDrawer();
        }}
      />

      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        setIsOpen={setIsDeleteConfirmOpen}
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        items={selectedTransactions}
        itemType="transaction"
        renderItem={(transaction) => (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">{transaction.description}</span>
              <Badge
                variant="outline"
                className="text-muted-foreground px-1.5 flex items-center"
              >
                {getIconBySlug(transaction.icon)}
                {transaction.category}
              </Badge>
            </div>
            <div
              className={
                transaction.type === "Expense"
                  ? "text-destructive"
                  : "text-emerald-500"
              }
            >
              {transaction.type === "Expense" ? "-" : "+"}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Math.abs(transaction.amount))}
            </div>
          </div>
        )}
      />
    </div>
  );
}
