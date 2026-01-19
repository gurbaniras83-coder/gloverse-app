
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, ChevronLeft } from "lucide-react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import NextImage from "next/image";
import { checkHandleUniqueness } from "@/lib/actions";
import { debounce } from "lodash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const customizeSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").max(50),
  handle: z.string()
    .min(3, "Handle must be at least 3 characters.")
    .max(20, "Handle must be less than 20 characters.")
    .regex(/^[a-zA-Z0-9_.]+$/, "Handle can only contain letters, numbers, underscores, and periods."),
  bio: z.string().max(160, "Bio must be less than 160 characters.").optional(),
});

type CustomizeFormValues = z.infer<typeof customizeSchema>;

export default function CustomizeChannelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"checking" | "unique" | "taken" | "idle">("idle");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CustomizeFormValues>({
    resolver: zodResolver(customizeSchema),
    defaultValues: {
      fullName: "",
      handle: "",
      bio: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!loading && user?.channel) {
      form.reset({
        fullName: user.channel.fullName,
        handle: user.channel.handle,
        bio: user.channel.bio,
      });
      setAvatarPreview(user.channel.photoURL);
      setBannerPreview(user.channel.bannerUrl || null);
    } else if (!loading && !user) {
        router.replace('/login');
    }
  }, [user, loading, form, router]);

  const debouncedCheck = useCallback(
    debounce(async (handle: string) => {
      if (handle.length < 3 || handle === user?.channel?.handle) {
        setHandleStatus("idle");
        return;
      }
      setHandleStatus("checking");
      const result = await checkHandleUniqueness(handle);
      setHandleStatus(result.isUnique ? "unique" : "taken");
    }, 500),
    [user?.channel?.handle]
  );

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const handle = e.target.value.toLowerCase();
    form.setValue("handle", handle, { shouldValidate: true });
    debouncedCheck(handle);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        if(fileType === 'avatar') {
            setAvatarFile(file);
            setAvatarPreview(reader.result as string);
        } else {
            setBannerFile(file);
            setBannerPreview(reader.result as string);
        }
    }
    reader.readAsDataURL(file);
  }

  const onSubmit = async (data: CustomizeFormValues) => {
    if (!user || !user.channel || handleStatus === 'taken') {
      toast({ variant: "destructive", title: "Cannot save", description: "Please fix the errors before saving." });
      return;
    }
    
    setIsSaving(true);
    
    try {
      let photoURL = user.channel.photoURL;
      let bannerUrl = user.channel.bannerUrl;

      const uploadFile = (file: File, path: string) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            () => {},
            (error) => reject(error),
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
          );
        });
      };
      
      if (avatarFile) {
        const avatarPath = `avatars/${user.uid}/${avatarFile.name}`;
        photoURL = await uploadFile(avatarFile, avatarPath);
      }

      if (bannerFile) {
        const bannerPath = `banners/${user.uid}/${bannerFile.name}`;
        bannerUrl = await uploadFile(bannerFile, bannerPath);
      }
      
      const channelRef = doc(db, "channels", user.channel.id);
      await updateDoc(channelRef, {
        fullName: data.fullName,
        handle: data.handle.toLowerCase(),
        bio: data.bio,
        photoURL,
        bannerUrl: bannerUrl || "",
      });

      toast({ title: "Success", description: "Your channel has been updated!" });
      router.push(`/@${data.handle.toLowerCase()}`);
      router.refresh(); // Force refresh to update user context
    } catch (error: any) {
      console.error("Save failed", error);
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
        setIsSaving(false);
    }
  };
  
  if(loading || !user?.channel) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold font-headline">Customize Channel</h1>
            <div className="w-10"></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
                <FormLabel>Branding</FormLabel>
                <div className="flex flex-col items-center gap-6">
                    {/* Banner */}
                    <div className="w-full relative">
                        <div 
                          className="relative aspect-[3/1] w-full rounded-xl bg-secondary flex flex-col items-center justify-center cursor-pointer hover:bg-muted group"
                          onClick={() => bannerInputRef.current?.click()}
                        >
                            {bannerPreview ? (
                                <NextImage src={bannerPreview} alt="Banner preview" layout="fill" className="rounded-md object-cover" />
                            ) : (
                                <div className="text-center">
                                    <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                                    <p className="mt-1 text-xs text-muted-foreground">Upload banner</p>
                                </div>
                            )}
                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-semibold">Change Banner</p>
                            </div>
                        </div>
                         <Input type="file" accept="image/*" ref={bannerInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                    </div>

                    {/* Avatar */}
                     <div 
                        className="relative h-24 w-24 rounded-full cursor-pointer group -mt-12 border-4 border-background"
                        onClick={() => avatarInputRef.current?.click()}
                     >
                        <Avatar className="h-full w-full">
                            <AvatarImage src={avatarPreview || ''} alt="Avatar preview"/>
                            <AvatarFallback>{form.getValues("handle")?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs text-center">Change</p>
                        </div>
                    </div>
                     <Input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />

                </div>
            </div>

            <div className="space-y-4">
                <FormLabel>Basic Info</FormLabel>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">@</span>
                          <Input 
                            placeholder="your_handle" 
                            {...field}
                            onChange={handleHandleChange}
                            className="pl-7"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                       {handleStatus === 'taken' && <p className="text-sm font-medium text-destructive">This handle is already taken.</p>}
                       {handleStatus === 'checking' && <p className="text-sm text-muted-foreground">Checking availability...</p>}
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                        <FormControl><Textarea placeholder="Tell us about your channel..." {...field} /></FormControl>
                        <FormDescription>A brief description for your channel.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSaving || handleStatus === 'taken' || handleStatus === 'checking'}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
          </form>
        </Form>
    </div>
  );
}

    