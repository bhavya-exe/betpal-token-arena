
import React from 'react';
import Header from '@/components/Header';
import { useBetPal } from '@/contexts/BetPalContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import TokenDisplay from '@/components/TokenDisplay';
import BetCard from '@/components/BetCard';
import { User, Calendar, BarChart, Activity } from 'lucide-react';
import { Bet } from '@/types/bet.types';

const Profile = () => {
  const { currentUser, bets, isLoggedIn } = useBetPal();
  const navigate = useNavigate();
  
  // Redirect to login if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);
  
  if (!currentUser) {
    return null; // Will redirect
  }
  
  // Filter user's bets
  const userBets = bets.filter(bet => 
    bet.participants?.some(p => p.id === currentUser.id) || bet.created_by === currentUser.id
  );
  
  const createdBets = bets.filter(bet => bet.created_by === currentUser.id);
  const participatedBets = bets.filter(bet => 
    bet.participants?.some(p => p.id === currentUser.id) && bet.created_by !== currentUser.id
  );
  const wonBets = bets.filter(bet => 
    bet.status === 'completed' && bet.winner_id === currentUser.id
  );
  
  // Calculate statistics
  const totalBetsCount = userBets.length;
  const winRate = currentUser.totalWins > 0 
    ? Math.round((currentUser.totalWins / (currentUser.totalWins + currentUser.totalLosses)) * 100) 
    : 0;
  const tokensWon = wonBets.reduce((total, bet) => {
    // Count participants who accepted the bet
    const participantCount = bet.participants?.filter(p => p.status === 'accepted').length || 0;
    return total + (bet.stake * (participantCount + 1)); // +1 for creator
  }, 0);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-betting-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{currentUser.username}</h2>
                    <p className="text-gray-500">{currentUser.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="font-medium">{currentUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">April 2025</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <BarChart size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Win Rate</p>
                      <p className="font-medium">{winRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Total Bets</p>
                      <p className="font-medium">{totalBetsCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Button variant="outline" className="w-full">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
            
            <TokenDisplay />
            
            <Card>
              <CardHeader>
                <CardTitle>Betting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-xl font-semibold">{createdBets.length}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Participated</p>
                    <p className="text-xl font-semibold">{participatedBets.length}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-700">Won</p>
                    <p className="text-xl font-semibold text-betting-win">{currentUser.totalWins}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md">
                    <p className="text-sm text-red-700">Lost</p>
                    <p className="text-xl font-semibold text-betting-loss">{currentUser.totalLosses}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">Tokens Won</p>
                  <div className="flex items-center">
                    <div className="token w-5 h-5 mr-2">
                      <span className="token-text text-xs">T</span>
                    </div>
                    <p className="text-xl font-semibold text-betting-primary">{tokensWon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>Betting History</CardTitle>
                <CardDescription>Your past and current bets</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="all">All Bets</TabsTrigger>
                    <TabsTrigger value="created">Created</TabsTrigger>
                    <TabsTrigger value="participated">Participated</TabsTrigger>
                    <TabsTrigger value="won">Won</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    {userBets.length > 0 ? (
                      <div className="space-y-4">
                        {userBets.map(bet => (
                          <BetCard key={bet.id} bet={bet as Bet} showActions={false} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        You have no bets yet. Start by creating one!
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="created">
                    {createdBets.length > 0 ? (
                      <div className="space-y-4">
                        {createdBets.map(bet => (
                          <BetCard key={bet.id} bet={bet as Bet} showActions={false} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        You haven't created any bets yet.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="participated">
                    {participatedBets.length > 0 ? (
                      <div className="space-y-4">
                        {participatedBets.map(bet => (
                          <BetCard key={bet.id} bet={bet as Bet} showActions={false} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        You haven't participated in any bets created by others.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="won">
                    {wonBets.length > 0 ? (
                      <div className="space-y-4">
                        {wonBets.map(bet => (
                          <BetCard key={bet.id} bet={bet as Bet} showActions={false} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        You haven't won any bets yet. Keep trying!
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
