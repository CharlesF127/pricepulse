import React, { useState } from 'react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const AddProductForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [size, setSize] = useState(''); // 👟 Shoe size (string input)

  const queryClient = useQueryClient();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const mutation = useMutation({
    mutationFn: async () => {
      const numericSize = Number(size);

      const response = await fetch("`${API_BASE}/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          url: productUrl,
          size: numericSize,
          site: "goat", // 🔹 explicit site for now
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.detail || "Something went wrong");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Product added for tracking", {
        description: `${productName} (Size ${size})`
      });

      // Invalidate product list for this user
      queryClient.invalidateQueries({ queryKey: ["products", userId] });

      setProductUrl('');
      setProductName('');
      setSize('');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to add product", {
        description: error.message
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productUrl || !productName || !size) {
      toast.error("Please fill in all fields");
      return;
    }

    const numericSize = Number(size);
    if (Number.isNaN(numericSize)) {
      toast.error("Size must be a valid number (e.g., 10 or 9.5)");
      return;
    }

    if (!token || !userId) {
      toast.error("You're not logged in.");
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-light">
          <PlusCircle className="mr-2 h-4 w-4" /> Track New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Product to Track</DialogTitle>
          <DialogDescription>
            Enter the product details you want to monitor for price changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productUrl" className="col-span-4">
                Product URL
              </Label>
              <Input
                id="productUrl"
                placeholder="https://goat.com/sneakers/..."
                className="col-span-4"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productName" className="col-span-4">
                Product Name
              </Label>
              <Input
                id="productName"
                placeholder="Kobe 9 Elite"
                className="col-span-4"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="size" className="col-span-4">
                Shoe Size
              </Label>
              <Input
                id="size"
                placeholder="10"
                className="col-span-4"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductForm;
