"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const categories = ["All", "Tech", "Music", "Gaming", "Travel", "News", "Food", "Design", "Animals"];

interface CategoryShelfProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryShelf({ selectedCategory, onSelectCategory }: CategoryShelfProps) {
  return (
    <div className="py-2 border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 px-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              onClick={() => onSelectCategory(category)}
              className="rounded-lg px-3 py-1 h-auto text-sm"
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
