"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  handle: z.string().min(1, "Handle is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string>("");
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Find user by handle in Firestore
      const lowerCaseHandle = values.handle.replace("@", "").toLowerCase();
      const q = query(collection(db, "channels"), where("handle", "==", lowerCaseHandle));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid credentials");
      }

      // 2. Get the email from the channel document
      const channelData = querySnapshot.docs[0].data();
      const email = channelData.email;

      if (!email) {
        // This would be an inconsistent data state, but good to handle
        throw new Error("No email found for this handle");
      }
      
      // 3. Sign in with the retrieved email and provided password
      await signInWithEmailAndPassword(auth, email, values.password);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The handle or password you entered is incorrect.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleMasterReset = async () => {
    setIsResetting(true);
    setResetStatus("Processing...");
    try {
        const response = await fetch('/api/master-reset', { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
            setResetStatus(data.message);
        } else {
            throw new Error(data.message || 'Failed to trigger reset.');
        }
    } catch (error: any) {
        setResetStatus(`Error: ${error.message}`);
    } finally {
        setIsResetting(false);
    }
  };


  return (
    <div className="flex flex-col items-center space-y-8">
      <Logo />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Log In</CardTitle>
          <CardDescription>
            Enter your handle and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <Input placeholder="@yourhandle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex justify-end -mt-4">
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
           {/* Temporary hidden master reset button */}
           <div className="pt-8 opacity-50">
                <Button variant="destructive" size="sm" onClick={handleMasterReset} disabled={isResetting}>
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Founder Override
                </Button>
                {resetStatus && <p className="text-xs text-center mt-2 text-muted-foreground">{resetStatus}</p>}
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
