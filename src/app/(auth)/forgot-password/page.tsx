
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  type ConfirmationResult
} from "firebase/auth";
import { auth } from "@/lib/firebase";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"


// Zod schema for different steps
const formSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number with country code (e.g., +15551234567)."),
  otp: z.string().min(6, "Your one-time password must be 6 characters."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).partial().refine((data) => {
    if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
    }
    return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step = 'enterPhone' | 'enterOtp' | 'resetPassword' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('enterPhone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [countdown, setCountdown] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout>();

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    },
    mode: "onChange",
  });

  // Initialize RecaptchaVerifier
  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
        // The 'recaptcha-container' must be visible for this to work.
        // We render it invisibly.
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(countdownIntervalRef.current);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(60);
  };

  const handleSendOtp = async (values: { phoneNumber: string }) => {
    setIsLoading(true);
    try {
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) {
          throw new Error("Recaptcha verifier not initialized.");
      }
      const result = await signInWithPhoneNumber(auth, values.phoneNumber, verifier);
      setConfirmationResult(result);
      setStep('enterOtp');
      startCountdown();
      toast({ title: "OTP Sent", description: "Please check your phone for the verification code." });
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send OTP",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (values: { otp: string }) => {
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(values.otp);
      // After confirmation, auth.currentUser is populated for this session.
      setStep('resetPassword');
      toast({ title: "OTP Verified", description: "You can now reset your password." });
    } catch (error: any) {
      console.error("OTP verify error:", error);
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The code you entered is incorrect. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async (values: { newPassword: string }) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "Your session has expired. Please start over." });
        setStep('enterPhone');
        setIsLoading(false);
        return;
    }
    try {
        await updatePassword(user, values.newPassword);
        setStep('success');
        toast({ title: "Password Reset Successful", description: "You can now log in with your new password." });
    } catch (error: any) {
        console.error("Password reset error:", error);
        toast({
            variant: "destructive",
            title: "Password Reset Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];
    if (step === 'enterPhone') fieldsToValidate = ["phoneNumber"];
    if (step === 'enterOtp') fieldsToValidate = ["otp"];
    if (step === 'resetPassword') fieldsToValidate = ["newPassword", "confirmPassword"];

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (step === 'enterPhone' && values.phoneNumber) {
      handleSendOtp({ phoneNumber: values.phoneNumber });
    } else if (step === 'enterOtp' && values.otp) {
      handleVerifyOtp({ otp: values.otp });
    } else if (step === 'resetPassword' && values.newPassword) {
      handleResetPassword({ newPassword: values.newPassword });
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-8">
      <Logo />
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <Card className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
              <CardDescription>
                {step === 'enterPhone' && "Enter your phone number to receive a verification code."}
                {step === 'enterOtp' && `We sent a code to ${form.getValues('phoneNumber')}.`}
                {step === 'resetPassword' && "Create a new, strong password."}
                {step === 'success' && "Your password has been reset."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {step === 'enterPhone' && (
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+15551234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 'enterOtp' && (
                  <div className="flex flex-col items-center gap-4">
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                             <InputOTP maxLength={6} {...field}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button type="button" variant="link" size="sm" onClick={() => handleSendOtp({ phoneNumber: form.getValues('phoneNumber')!})} disabled={countdown > 0 || isLoading}>
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </Button>
                  </div>
              )}
              
              {step === 'resetPassword' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 'success' && (
                 <div className="text-center p-4 rounded-md bg-secondary">
                    <p className="font-semibold">Success!</p>
                    <p className="text-sm text-muted-foreground">You can now use your new password to log in.</p>
                 </div>
              )}

               {step !== 'success' && (
                 <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {step === 'enterPhone' && "Send OTP"}
                    {step === 'enterOtp' && "Verify Code"}
                    {step === 'resetPassword' && "Set New Password"}
                 </Button>
              )}

            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
