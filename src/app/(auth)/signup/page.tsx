'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { debounce } from 'lodash';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, ArrowDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { checkHandleUniqueness, registerUser } from '@/lib/actions';

const signupSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters.')
    .max(20, 'Handle must be less than 20 characters.')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Handle can only contain letters, numbers, underscores, and periods.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name is required.').max(50),
  bio: z.string().max(160, 'Bio must be less than 160 characters.').optional(),
  email: z.string().email('Please enter a valid email address.'),
  phoneNumber: z.string().regex(/^[0-9]{10,15}$/, 'Please enter a valid phone number (10-15 digits).'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions to continue.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [handleStatus, setHandleStatus] = useState<'checking' | 'unique' | 'taken' | 'idle'>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getDeviceId = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
    };
    getDeviceId();
  }, []);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      handle: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      bio: '',
      email: '',
      phoneNumber: '',
      termsAccepted: false,
    },
    mode: 'onChange',
  });

  const debouncedCheck = useCallback(
    debounce(async (handle: string) => {
      if (handle.length < 3) {
        setHandleStatus('idle');
        return;
      }
      setHandleStatus('checking');
      try {
        const result = await checkHandleUniqueness(handle);
        setHandleStatus(result.isUnique ? 'unique' : 'taken');
      } catch (error) {
        console.error('Could not connect to server for handle check:', error);
        setHandleStatus('unique'); // Default to unique if server check fails
      }
    }, 500),
    []
  );

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const handle = e.target.value.toLowerCase();
    form.setValue('handle', handle, { shouldValidate: true });
    debouncedCheck(handle);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof signupSchema>)[] = [];
    if (step === 1) fieldsToValidate = ['handle'];
    if (step === 2) fieldsToValidate = ['password', 'confirmPassword'];
    if (step === 3) fieldsToValidate = ['fullName', 'bio'];
    if (step === 4) fieldsToValidate = ['email', 'phoneNumber'];

    const isValid = await form.trigger(fieldsToValidate);

    if (step === 1) {
      if (isValid && handleStatus === 'unique') {
        setStep((s) => s + 1);
      }
    } else if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    if (!deviceId) {
      toast({ variant: 'destructive', title: 'Device not identified', description: 'Please wait a moment and try again.' });
      return;
    }
    startTransition(async () => {
      const result = await registerUser({ ...values, deviceId });
      if (result.success) {
        toast({
          title: 'Account Created!',
          description: 'Welcome to Gloverse. You are now logged in.',
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: result.error,
        });
      }
    });
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 1) {
      setScrolledToBottom(true);
    }
  };

  const progress = Math.round((step / 5) * 100);

  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <Logo />
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <Progress value={progress} className="w-full h-2 mb-4" />
          <CardTitle className="text-2xl font-headline">Create your account</CardTitle>
          <CardDescription>
            {step === 1 && 'Choose your unique @handle.'}
            {step === 2 && 'Create a secure password.'}
            {step === 3 && 'Tell us a bit about your channel.'}
            {step === 4 && 'How can we reach you?'}
            {step === 5 && 'Please review and accept our terms.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
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
                            <FormLabel>Channel Description (Bio)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Tell us about yourself..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
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
                              <Input type="tel" placeholder="e.g. 15551234567" {...field} />
                            </FormControl>
                            <FormDescription>Numbers only, including country code if applicable.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {step === 5 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Privacy Policy & Terms of Service</h3>
                      <div
                        ref={termsRef}
                        onScroll={handleScroll}
                        className="h-48 overflow-y-auto p-4 border rounded-md bg-background text-sm text-muted-foreground relative"
                      >
                        <p className="font-bold mb-2">1. Data Collection</p>
                        <p className="mb-4">By creating an account, you agree to provide and maintain accurate information, including your handle, email, and phone number. This information is used for account management, security, and communication purposes.</p>

                        <p className="font-bold mb-2">2. Content & Conduct</p>
                        <p className="mb-1">- You are solely responsible for the content you upload.</p>
                        <p className="mb-1">- You must not upload content that is illegal, defamatory, or infringes on copyright, trademark, or other intellectual property rights.</p>
                        <p className="mb-4">- The use of bots, scripts, or any automated means to generate fake views, likes, or engagement is strictly prohibited and will result in account termination.</p>

                        <p className="font-bold mb-2">3. Monetization & Ads</p>
                        <p className="mb-4">You acknowledge and agree that GloVerse will display advertisements within the service, including alongside your content. You agree to our ad monetization rules and revenue sharing model as outlined in our creator dashboard.</p>

                        <p className="font-bold mb-2">4. Termination</p>
                        <p>We reserve the right to suspend or terminate your account at our discretion for any violation of these terms.</p>
                         {!scrolledToBottom && (
                            <div className="sticky bottom-0 left-0 right-0 flex justify-center items-center h-10 bg-gradient-to-t from-background to-transparent pointer-events-none">
                               <div className="flex items-center text-xs text-foreground bg-secondary p-1 rounded-full">
                                <ArrowDown className="h-3 w-3 mr-1 animate-bounce"/>
                                <span>Scroll to Bottom</span>
                               </div>
                            </div>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!scrolledToBottom} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>I have read, understood, and agree to the GloVerse Privacy Policy and Terms of Service.</FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="flex gap-4 pt-4">
                {step > 1 && <Button type="button" variant="outline" onClick={prevStep} className="w-full">Back</Button>}

                {step < 5 && <Button type="button" onClick={nextStep} className="w-full" disabled={(step === 1 && handleStatus !== 'unique') || isPending}>Next</Button>}

                {step === 5 && (
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                    disabled={isPending || !deviceId || !form.watch('termsAccepted')}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Channel'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
