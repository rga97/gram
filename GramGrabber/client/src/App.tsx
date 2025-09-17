import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PasswordProtection from "@/pages/password-protection";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleAuthenticated = (token: string) => {
    setAuthToken(token);
  };

  const handleLogout = () => {
    setAuthToken(null);
  };

  if (!authToken) {
    return <PasswordProtection onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Home token={authToken} onLogout={handleLogout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
