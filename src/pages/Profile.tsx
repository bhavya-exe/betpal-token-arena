
import React from 'react';
import Header from '@/components/Header';
import { useBetPal } from '@/contexts/BetPalContext';
import { useNavigate } from 'react-router-dom';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import BettingHistory from '@/components/profile/BettingHistory';
import { filterUserBets, calculateWinRate, calculateTokensWon } from '@/utils/betUtils';
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
  
  // Organize bets by type using our utility function
  const { userBets, createdBets, participatedBets, wonBets } = filterUserBets(
    bets, 
    currentUser.id
  );
  
  // Calculate statistics
  const totalBetsCount = userBets.length;
  const winRate = calculateWinRate(currentUser.totalWins, currentUser.totalLosses);
  const tokensWon = calculateTokensWon(wonBets);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <ProfileSidebar 
            username={currentUser.username}
            email={currentUser.email}
            totalBetsCount={totalBetsCount}
            winRate={winRate}
            createdCount={createdBets.length}
            participatedCount={participatedBets.length}
            totalWins={currentUser.totalWins}
            totalLosses={currentUser.totalLosses}
            tokensWon={tokensWon}
          />
          
          <div className="lg:w-2/3">
            <BettingHistory 
              allBets={userBets as Bet[]}
              createdBets={createdBets as Bet[]}
              participatedBets={participatedBets as Bet[]}
              wonBets={wonBets as Bet[]}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
