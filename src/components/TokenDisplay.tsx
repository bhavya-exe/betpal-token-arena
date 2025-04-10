
import React from 'react';
import { useBetPal } from '@/contexts/BetPalContext';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';

const TokenDisplay: React.FC = () => {
  const { currentUser } = useBetPal();
  
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Token Wallet</h3>
        <div className="token w-8 h-8">
          <span className="token-text text-xs">T</span>
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-betting-primary">{currentUser.tokenBalance}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-betting-win/10 text-betting-win border-betting-win">
              <ArrowUp size={12} className="mr-1" />
              Won
            </Badge>
          </div>
          <p className="text-xl font-semibold text-betting-win">{currentUser.totalWins}</p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-md">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-betting-loss/10 text-betting-loss border-betting-loss">
              <ArrowDown size={12} className="mr-1" />
              Lost
            </Badge>
          </div>
          <p className="text-xl font-semibold text-betting-loss">{currentUser.totalLosses}</p>
        </div>
      </div>
    </div>
  );
};

export default TokenDisplay;
