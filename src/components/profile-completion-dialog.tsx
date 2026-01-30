
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().regex(/^[0-9]{10,15}$/, "Please enter a valid phone number (10-15 digits)."),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileCompletionDialog() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (!loading && user && user.channel && !user.channel.phoneNumber) {
      setIsOpen(true);
      form.reset({
        email: user.email || user.channel.email || "",
        phoneNumber: "",
      });
    } else {
      setIsOpen(false);
    }
  }, [user, loading, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user || !user.channel) return;
    setIsSaving(true);
    try {
      const channelRef = doc(db, "channels", user.channel.id);
      await updateDoc(channelRef, {
        phoneNumber: data.phoneNumber,
        email: data.email, // ensure email is also updated if it was missing
      });
      toast({ title: "Profile Updated", description: "Your security information has been saved." });
      setIsOpen(false);
      // We might need to refresh the auth context state here
      // For now, a page refresh on next navigation will pick it up
    } catch (error) {
      console.error("Failed to update profile", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your information." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
            // Prevent closing by clicking outside
            e.preventDefault();
        }}
        hideCloseButton={true} // A custom prop to hide the 'x' if we add it to DialogContent
      >
        <DialogHeader>
          <DialogTitle>Security Update Required</DialogTitle>
          <DialogDescription>
            To protect your account and enable password recovery, please link your phone number and confirm your email address.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 15551234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    