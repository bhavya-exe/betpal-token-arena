
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BettingSummaryProps {
  createdCount: number;
  participatedCount: number;
  totalWins: number;
  totalLosses: number;
  tokensWon: number;
}

const BettingSummary: React.FC<BettingSummaryProps> = ({ 
  createdCount, 
  participatedCount, 
  totalWins, 
  totalLosses, 
  tokensWon 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-xl font-semibold">{createdCount}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Participated</p>
            <p className="text-xl font-semibold">{participatedCount}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-700">Won</p>
            <p className="text-xl font-semibold text-betting-win">{totalWins}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-sm text-red-700">Lost</p>
            <p className="text-xl font-semibold text-betting-loss">{totalLosses}</p>
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
  );
};

export default BettingSummary;
