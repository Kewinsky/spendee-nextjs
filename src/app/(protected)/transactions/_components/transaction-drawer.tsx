"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarIcon,
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

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Calendar } from "@/components/ui/calendar";

import {
  type Transaction,
  type TransactionFormValues,
  transactionFormSchema,
  emptyTransactionForm,
} from "@/lib/schemas";

interface TransactionDrawerProps {
  activeItem: Transaction | null;
  viewMode: "add" | "edit" | "view";
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

export function TransactionDrawer({
  activeItem,
  viewMode,
  isOpen,
  setIsOpen,
  onClose,
  onSave,
}: TransactionDrawerProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: activeItem
      ? {
          id: activeItem.id,
          date: activeItem.date,
          description: activeItem.description,
          amount: activeItem.amount,
          category: activeItem.category,
          type: activeItem.type as "Income" | "Expense",
          notes: activeItem.notes || "",
        }
      : emptyTransactionForm,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (activeItem) {
      form.reset({
        id: activeItem.id,
        date: activeItem.date,
        description: activeItem.description,
        amount: activeItem.amount,
        category: activeItem.category,
        type: activeItem.type as "Income" | "Expense",
        notes: activeItem.notes || "",
      });
    } else {
      form.reset(emptyTransactionForm);
    }
  }, [activeItem, form]);

  const onSubmit = (values: TransactionFormValues) => {
    const icon = getCategoryIcon(values.category);

    onSave({
      id: values.id || Date.now(),
      date: values.date,
      description: values.description,
      amount: Number(values.amount),
      category: values.category,
      type: values.type,
      notes: values.notes || "",
      icon,
    });
  };

  const isReadOnly = viewMode === "view";

  function getCategoryIcon(category: string): string {
    switch (category) {
      case "Groceries":
        return "Utensils";
      case "Housing":
        return "Home";
      case "Transportation":
        return "Car";
      case "Dining":
        return "Utensils";
      case "Entertainment":
        return "Film";
      case "Healthcare":
        return "Heart";
      case "Salary":
        return "Briefcase";
      case "Investments":
        return "TrendingUp";
      case "Freelance":
        return "DollarSign";
      default:
        return "Package";
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
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
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
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
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3">
                    <FormLabel>Category</FormLabel>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md flex items-center gap-2">
                        {(() => {
                          const icon = getCategoryIcon(field.value);
                          switch (icon) {
                            case "Utensils":
                              return <Utensils className="h-4 w-4" />;
                            case "Car":
                              return <Car className="h-4 w-4" />;
                            case "Home":
                              return <Home className="h-4 w-4" />;
                            case "Lightbulb":
                              return <Lightbulb className="h-4 w-4" />;
                            case "Film":
                              return <Film className="h-4 w-4" />;
                            case "Heart":
                              return <Heart className="h-4 w-4" />;
                            case "Briefcase":
                              return <Briefcase className="h-4 w-4" />;
                            case "TrendingUp":
                              return <TrendingUp className="h-4 w-4" />;
                            default:
                              return <Package className="h-4 w-4" />;
                          }
                        })()}
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
                          <SelectItem value="Food">
                            <div className="flex items-center">
                              <Utensils className="mr-2 h-4 w-4" />
                              Food
                            </div>
                          </SelectItem>
                          <SelectItem value="Transportation">
                            <div className="flex items-center">
                              <Car className="mr-2 h-4 w-4" />
                              Transportation
                            </div>
                          </SelectItem>
                          <SelectItem value="Housing">
                            <div className="flex items-center">
                              <Home className="mr-2 h-4 w-4" />
                              Housing
                            </div>
                          </SelectItem>
                          <SelectItem value="Utilities">
                            <div className="flex items-center">
                              <Lightbulb className="mr-2 h-4 w-4" />
                              Utilities
                            </div>
                          </SelectItem>
                          <SelectItem value="Entertainment">
                            <div className="flex items-center">
                              <Film className="mr-2 h-4 w-4" />
                              Entertainment
                            </div>
                          </SelectItem>
                          <SelectItem value="Healthcare">
                            <div className="flex items-center">
                              <Heart className="mr-2 h-4 w-4" />
                              Healthcare
                            </div>
                          </SelectItem>
                          <SelectItem value="Salary">
                            <div className="flex items-center">
                              <Briefcase className="mr-2 h-4 w-4" />
                              Salary
                            </div>
                          </SelectItem>
                          <SelectItem value="Investment">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Investment
                            </div>
                          </SelectItem>
                          <SelectItem value="Other">
                            <div className="flex items-center">
                              <Package className="mr-2 h-4 w-4" />
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
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button type="submit" form="transaction-form">
                {activeItem ? "Update Transaction" : "Add Transaction"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
