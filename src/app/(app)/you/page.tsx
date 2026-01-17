"use client";

import { useAuth } from "@/context/auth-provider";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, Settings, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function YouPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }
  
  if (!user.channel) {
    // This case might happen briefly after signup.
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <div>
          <p className="mb-4">Setting up your channel...</p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col items-center space-y-4 pt-8">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={user.channel.photoURL} alt={user.channel.handle} />
          <AvatarFallback className="text-3xl">
            {user.channel.handle.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold font-headline">{user.channel.fullName}</h1>
          <p className="text-muted-foreground">@{user.channel.handle}</p>
        </div>
      </div>
      
      <div className="mt-8 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
          <Link href="/studio">
            <BarChart2 className="h-5 w-5 text-primary" />
            Gloverse Studio
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
