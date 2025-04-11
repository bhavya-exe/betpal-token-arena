
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import BetCard from '@/components/BetCard';
import TokenDisplay from '@/components/TokenDisplay';
import { Trophy, LayoutDashboard, HandCoins } from 'lucide-react';
import { useBet } from '@/contexts/BetContext';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { bets, loadingBets } = useBet();
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/welcome');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading || !user || !profile) {
    return null; // Will redirect to welcome
  }
  
  // Filter bets the user is participating in
  const userBets = bets.filter(bet => 
    bet.participants?.some(p => p.id === user.id) || bet.created_by === user.id
  );
  
  const activeBets = userBets.filter(bet => bet.status === 'active');
  const pendingBets = userBets.filter(bet => bet.status === 'pending');
  const completedBets = userBets.filter(bet => bet.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3); // Only show 3 most recent
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile.username}!</h1>
            <p className="text-gray-500">Track your bets and manage your tokens</p>
          </div>
          
          <Link to="/create-bet">
            <Button className="w-full md:w-auto">
              Create New Bet
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            {activeBets.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <HandCoins className="mr-2 h-5 w-5 text-betting-primary" />
                  <h2 className="text-xl font-semibold">Active Bets</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBets.map(bet => (
                    <BetCard key={bet.id} bet={bet} />
                  ))}
                </div>
              </section>
            )}
            
            {pendingBets.length > 0 && (
              <section>
                <div className="flex items-center mb-4">
                  <LayoutDashboard className="mr-2 h-5 w-5 text-betting-accent" />
                  <h2 className="text-xl font-semibold">Pending Bets</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBets.map(bet => (
                    <BetCard key={bet.id} bet={bet} />
                  ))}
                </div>
              </section>
            )}
            
            {completedBets.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-betting-win" />
                    <h2 className="text-xl font-semibold">Recent Completed Bets</h2>
                  </div>
                  <Link to="/bets" className="text-sm text-betting-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedBets.map(bet => (
                    <BetCard key={bet.id} bet={bet} showActions={false} />
                  ))}
                </div>
              </section>
            )}
            
            {activeBets.length === 0 && pendingBets.length === 0 && completedBets.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No Bets Yet</CardTitle>
                  <CardDescription>Time to create your first bet!</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <Link to="/create-bet">
                    <Button>Create Your First Bet</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <TokenDisplay />
            
            <Card>
              <CardHeader>
                <CardTitle>How Betting Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">1. Create a Bet</h3>
                  <p className="text-sm text-gray-500">Set title, description, stake amount, and deadline</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">2. Share with Friend</h3>
                  <p className="text-sm text-gray-500">Send them a link to join the bet</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">3. Resolution</h3>
                  <p className="text-sm text-gray-500">
                    Self-resolved: Both sides agree on winner
                    <br />
                    Judge-resolved: Third party decides
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">4. Token Transfer</h3>
                  <p className="text-sm text-gray-500">Winner receives all staked tokens</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
