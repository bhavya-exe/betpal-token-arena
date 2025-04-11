
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { BetProvider } from "@/contexts/BetContext";

// Pages
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Bets from "./pages/Bets";
import CreateBet from "./pages/CreateBet";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FriendsProvider>
        <BetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/bets" element={<Bets />} />
                <Route path="/create-bet" element={<CreateBet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BetProvider>
      </FriendsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
