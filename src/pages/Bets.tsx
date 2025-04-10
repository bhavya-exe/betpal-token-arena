
import React, { useState } from 'react';
import Header from '@/components/Header';
import { useBetPal } from '@/contexts/BetPalContext';
import BetCard from '@/components/BetCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, Plus, HandCoins, Clock, Trophy } from 'lucide-react';

const Bets = () => {
  const { bets, currentUser } = useBetPal();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get user's bets
  const userBets = currentUser 
    ? bets.filter(bet => 
        bet.participants.includes(currentUser.id) || bet.createdBy === currentUser.id
      )
    : [];
  
  // Filter by status
  const activeBets = userBets.filter(bet => bet.status === 'active');
  const pendingBets = userBets.filter(bet => bet.status === 'pending');
  const completedBets = userBets.filter(bet => bet.status === 'completed');
  
  // Filter by search query
  const filterBets = (betsToFilter) => {
    if (!searchQuery) return betsToFilter;
    
    return betsToFilter.filter(bet => 
      bet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bet.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredActiveBets = filterBets(activeBets);
  const filteredPendingBets = filterBets(pendingBets);
  const filteredCompletedBets = filterBets(completedBets);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Bets</h1>
            <p className="text-gray-500">Track and manage all your betting activities</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bets..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link to="/create-bet">
              <Button className="whitespace-nowrap">
                <Plus size={16} className="mr-2" />
                New Bet
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="active" className="flex items-center">
              <HandCoins size={16} className="mr-2 hidden sm:block" />
              Active
              {activeBets.length > 0 && (
                <span className="ml-2 bg-betting-primary/10 text-betting-primary text-xs px-2 py-0.5 rounded-full">
                  {activeBets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center">
              <Clock size={16} className="mr-2 hidden sm:block" />
              Pending
              {pendingBets.length > 0 && (
                <span className="ml-2 bg-betting-accent/10 text-betting-accent text-xs px-2 py-0.5 rounded-full">
                  {pendingBets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <Trophy size={16} className="mr-2 hidden sm:block" />
              Completed
              {completedBets.length > 0 && (
                <span className="ml-2 bg-betting-win/10 text-betting-win text-xs px-2 py-0.5 rounded-full">
                  {completedBets.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {filteredActiveBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActiveBets.map(bet => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Bets</CardTitle>
                  <CardDescription>
                    {searchQuery ? 'No active bets match your search.' : 'You have no active bets at the moment.'}
                  </CardDescription>
                </CardHeader>
                {!searchQuery && (
                  <CardContent className="flex justify-center py-6">
                    <Link to="/create-bet">
                      <Button>Create a New Bet</Button>
                    </Link>
                  </CardContent>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="pending">
            {filteredPendingBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPendingBets.map(bet => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Pending Bets</CardTitle>
                  <CardDescription>
                    {searchQuery ? 'No pending bets match your search.' : 'You have no pending bets waiting for participants.'}
                  </CardDescription>
                </CardHeader>
                {!searchQuery && (
                  <CardContent className="flex justify-center py-6">
                    <Link to="/create-bet">
                      <Button>Create a New Bet</Button>
                    </Link>
                  </CardContent>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {filteredCompletedBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompletedBets.map(bet => (
                  <BetCard key={bet.id} bet={bet} showActions={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Completed Bets</CardTitle>
                  <CardDescription>
                    {searchQuery ? 'No completed bets match your search.' : 'You have no completed bets yet.'}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Bets;
