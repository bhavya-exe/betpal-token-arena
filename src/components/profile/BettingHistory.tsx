
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BetCard from '@/components/BetCard';
import { Bet } from '@/types/bet.types';

interface BettingHistoryProps {
  allBets: Bet[];
  createdBets: Bet[];
  participatedBets: Bet[];
  wonBets: Bet[];
}

const BettingHistory: React.FC<BettingHistoryProps> = ({ 
  allBets, 
  createdBets, 
  participatedBets, 
  wonBets 
}) => {
  return (
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
            {allBets.length > 0 ? (
              <div className="space-y-4">
                {allBets.map(bet => (
                  <BetCard key={bet.id} bet={bet} showActions={false} />
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
                  <BetCard key={bet.id} bet={bet} showActions={false} />
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
                  <BetCard key={bet.id} bet={bet} showActions={false} />
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
                  <BetCard key={bet.id} bet={bet} showActions={false} />
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
  );
};

export default BettingHistory;
