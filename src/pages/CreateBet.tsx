
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BetForm from '@/components/BetForm';
import { useBetPal } from '@/contexts/BetPalContext';
import { useNavigate } from 'react-router-dom';
import { CircleBan } from 'lucide-react';

const CreateBet = () => {
  const { currentUser, isLoggedIn } = useBetPal();
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Create a New Bet</h1>
        <p className="text-gray-500 mb-8">Set up a friendly bet with your defined conditions</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Bet Details</CardTitle>
                <CardDescription>Enter the details of your bet</CardDescription>
              </CardHeader>
              <CardContent>
                <BetForm />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Betting Guidelines</CardTitle>
                <CardDescription>How to create a successful bet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Be Specific</h3>
                  <p className="text-sm text-gray-600">
                    Clearly define the conditions and how success will be determined
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Set Reasonable Stakes</h3>
                  <p className="text-sm text-gray-600">
                    Don't stake more tokens than you're comfortable losing
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose Resolution Type</h3>
                  <p className="text-sm text-gray-600">
                    Self-resolved: Both parties agree on the outcome
                    <br />
                    Judge-resolved: A third party decides
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Set Clear Deadlines</h3>
                  <p className="text-sm text-gray-600">
                    When must the bet be completed by?
                  </p>
                </div>
                
                <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-md">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <CircleBan size={16} />
                    <h3 className="font-semibold">Prohibited Bets</h3>
                  </div>
                  <p className="text-xs text-red-600">
                    Bets involving illegal activities, harm to oneself or others, or that violate our Terms of Service are prohibited.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">Your Token Balance</h3>
              <div className="flex items-center">
                <div className="token w-6 h-6 mr-2">
                  <span className="token-text text-xs">T</span>
                </div>
                <span className="text-2xl font-bold text-betting-primary">{currentUser.tokenBalance}</span>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Tokens will be held in escrow until the bet is resolved.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateBet;
