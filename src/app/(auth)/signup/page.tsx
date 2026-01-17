"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { debounce } from "lodash";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { checkHandleUniqueness, registerUser } from "@/lib/actions";

// Simplified single schema to prevent merge errors
const signupSchema = z.object({
  handle: z.string()
    .min(3, "Handle must be at least 3 characters.")
    .max(20, "Handle must be less than 20 characters.")
    .regex(/^[a-zA-Z0-9_.]+$/, "Handle can only contain letters, numbers, underscores, and periods."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name is required.").max(50),
  bio: z.string().max(160, "Bio must be less than 160 characters.").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [handleStatus, setHandleStatus] = useState<"checking" | "unique" | "taken" | "idle">("idle");

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      handle: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      bio: "",
    },
    mode: "onChange",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheck = useCallback(
    debounce(async (handle: string) => {
      if (handle.length < 3) {
        setHandleStatus("idle");
        return;
      }
      setHandleStatus("checking");
      try {
        const result = await checkHandleUniqueness(handle);
        if (result.error) {
          // Fail-safe: Handle server/connection errors gracefully
          setHandleStatus("idle"); // Reset status to allow retries
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Could not verify handle. Please try again.",
          });
        } else {
          // Correctly set status based on uniqueness
          setHandleStatus(result.isUnique ? "unique" : "taken");
        }
      } catch (error) {
        setHandleStatus("idle");
        toast({
            variant: "destructive",
            title: "Error checking handle",
            description: "Could not verify handle. Please try again.",
        })
      }
    }, 500),
    [toast]
  );

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Immediately convert to lowercase for consistent validation and checking
    const handle = e.target.value;
    form.setValue("handle", handle, { shouldValidate: true });
    debouncedCheck(handle);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof signupSchema>)[] = [];
    if (step === 1) fieldsToValidate = ["handle"];
    if (step === 2) fieldsToValidate = ["password", "confirmPassword"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && (step !== 1 || handleStatus === 'unique')) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    startTransition(async () => {
      const result = await registerUser(values);
      if (result.success) {
        toast({
          title: "Account Created!",
          description: "Welcome to Gloverse. Please log in.",
        });
        router.push("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error,
        });
      }
    });
  }

  const progress = Math.round((step / 3) * 100);

  return (
    <div className="flex flex-col items-center space-y-6">
      <Logo />
      <Card className="w-full">
        <CardHeader>
          <Progress value={progress} className="w-full h-2 mb-4" />
          <CardTitle className="text-2xl font-headline">Create your account</CardTitle>
          <CardDescription>
            {step === 1 && "Choose your unique handle."}
            {step === 2 && "Create a secure password."}
            {step === 3 && "Tell us a bit about yourself."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handle</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="your_handle" 
                            {...field} 
                            onChange={handleHandleChange}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {handleStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {handleStatus === 'unique' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {handleStatus === 'taken' && <XCircle className="h-4 w-4 text-destructive" />}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                       {handleStatus === 'taken' && <p className="text-sm font-medium text-destructive">This handle is already taken.</p>}
                    </FormItem>
                  )}
                />
              )}
              {step === 2 && (
                <>
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about yourself..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <div className="flex gap-4">
                {step > 1 && <Button type="button" variant="outline" onClick={prevStep} className="w-full">Back</Button>}
                {step < 3 && <Button type="button" onClick={nextStep} className="w-full" disabled={handleStatus !== 'unique'}>Next</Button>}
                {step === 3 && (
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
