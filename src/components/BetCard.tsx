
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hourglass, Calendar, Trophy, Users, Gavel, LayoutDashboard } from 'lucide-react';
import { Bet } from '@/types/bet.types';
import { useBetPal } from '@/contexts/BetPalContext';
import { formatDistanceToNow } from 'date-fns';

interface BetCardProps {
  bet: Bet;
  showActions?: boolean;
}

const BetCard: React.FC<BetCardProps> = ({ bet, showActions = true }) => {
  const { joinBet, resolveBet, currentUser } = useBetPal();
  
  const isCreator = currentUser?.id === bet.createdBy;
  const isParticipant = currentUser ? bet.participants.includes(currentUser.id) : false;
  const isJudge = currentUser?.id === bet.judge;
  const canJoin = currentUser && !isParticipant && bet.status === 'pending';
  const canResolve = currentUser && (
    (bet.status === 'active' && bet.resolutionType === 'self' && isParticipant) ||
    (bet.status === 'active' && bet.resolutionType === 'judge' && isJudge)
  );
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const handleJoin = () => {
    joinBet(bet.id);
  };
  
  const handleResolve = () => {
    if (isJudge || isParticipant) {
      // In a real app, we'd show a dialog to select the winner
      // For demo, we'll just pick the first participant
      const winnerId = bet.participants[0];
      resolveBet(bet.id, winnerId);
    }
  };
  
  const getDeadlineText = () => {
    if (new Date(bet.deadline) < new Date()) {
      return `Expired ${formatDistanceToNow(new Date(bet.deadline))} ago`;
    }
    return `Ends ${formatDistanceToNow(new Date(bet.deadline))} from now`;
  };
  
  const renderStatusBadge = () => (
    <div className="flex items-center">
      <Badge variant="outline" className={`${getStatusColor(bet.status)} capitalize`}>
        {bet.status}
      </Badge>
    </div>
  );
  
  const renderResolutionBadge = () => (
    <div className="flex items-center ml-2">
      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 capitalize">
        {bet.resolutionType === 'judge' ? (
          <Gavel size={12} className="mr-1" />
        ) : (
          <Users size={12} className="mr-1" />
        )}
        {bet.resolutionType}
      </Badge>
    </div>
  );
  
  return (
    <Card className="bet-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{bet.title}</CardTitle>
          <div className="flex flex-col md:flex-row items-end md:items-center">
            <div className="token w-8 h-8">
              <span className="token-text text-xs">{bet.stake}</span>
            </div>
          </div>
        </div>
        <CardDescription>{bet.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-2" />
            <span>{getDeadlineText()}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Users size={16} className="mr-2" />
            <span>{bet.participants.length} participant{bet.participants.length !== 1 ? 's' : ''}</span>
          </div>
          
          {bet.winner && (
            <div className="flex items-center text-sm text-betting-win">
              <Trophy size={16} className="mr-2" />
              <span>Winner declared</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <div className="flex items-center w-full">
          {renderStatusBadge()}
          {renderResolutionBadge()}
        </div>
        
        {showActions && (
          <div className="flex justify-end w-full">
            {canJoin && (
              <Button variant="outline" className="mr-2" onClick={handleJoin}>
                Join Bet
              </Button>
            )}
            {canResolve && (
              <Button variant="default" onClick={handleResolve}>
                Resolve Bet
              </Button>
            )}
            {!canJoin && !canResolve && currentUser && (
              <Button variant="outline" disabled>
                {isParticipant ? 'Participating' : 'Not Available'}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default BetCard;
