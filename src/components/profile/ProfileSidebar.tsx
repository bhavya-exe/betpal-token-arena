
import React from 'react';
import TokenDisplay from '@/components/TokenDisplay';
import ProfileHeader from './ProfileHeader';
import BettingSummary from './BettingSummary';

interface ProfileSidebarProps {
  username: string;
  email: string;
  totalBetsCount: number;
  winRate: number;
  createdCount: number;
  participatedCount: number;
  totalWins: number;
  totalLosses: number;
  tokensWon: number;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  username,
  email,
  totalBetsCount,
  winRate,
  createdCount,
  participatedCount,
  totalWins,
  totalLosses,
  tokensWon
}) => {
  return (
    <div className="lg:w-1/3 space-y-6">
      <ProfileHeader 
        username={username}
        email={email}
        totalBetsCount={totalBetsCount}
        winRate={winRate}
      />
      
      <TokenDisplay />
      
      <BettingSummary
        createdCount={createdCount}
        participatedCount={participatedCount}
        totalWins={totalWins}
        totalLosses={totalLosses}
        tokensWon={tokensWon}
      />
    </div>
  );
};

export default ProfileSidebar;
