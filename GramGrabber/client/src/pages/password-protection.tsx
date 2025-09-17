import { useState } from "react";
import { Shield, Unlock, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PasswordProtectionProps {
  onAuthenticated: (token: string) => void;
}

export default function PasswordProtection({ onAuthenticated }: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Access Granted",
          description: "Welcome to the Instagram Profile Downloader",
        });
        onAuthenticated(data.token);
      } else {
        toast({
          title: "Access Denied",
          description: data.error || "Invalid access code",
          variant: "destructive",
        });
        setPassword("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate access code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="security-indicator inline-block p-4 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Secure Access Required</h1>
          <p className="text-muted-foreground">Enter the access code to continue</p>
        </div>

        <div className="gradient-border">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Access Code</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter access code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    data-testid="input-password"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password}
                data-testid="button-submit"
              >
                <Unlock className="w-4 h-4 mr-2" />
                {isLoading ? "Validating..." : "Access Application"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>256-bit SSL Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
