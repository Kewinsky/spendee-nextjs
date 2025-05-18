"use client";

import type React from "react";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface DeleteConfirmationProps<TData> {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  items: TData[];
  itemType: string;
  renderItem: (item: TData) => React.ReactNode;
}

export function DeleteConfirmation<TData>({
  isOpen,
  setIsOpen,
  onConfirm,
  onCancel,
  items,
  itemType,
  renderItem,
}: DeleteConfirmationProps<TData>) {
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Confirm Deletion</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete {items.length} {itemType}(s)?
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="rounded-md border p-4">
            <h3 className="font-medium mb-2">Selected {itemType}s:</h3>
            <div className="max-h-[300px] overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="py-2 border-b last:border-b-0">
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            This action cannot be undone. These {itemType}s will be permanently
            deleted.
          </div>
        </div>
        <DrawerFooter>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="mr-2 h-4 w-4" />
            Confirm Delete
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
