
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-betting-primary/10 to-gray-50">
      <div className="container px-4 py-12 mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <div className="flex items-center mb-6">
              <div className="token mr-2">
                <span className="token-text">B</span>
              </div>
              <h1 className="text-4xl font-bold text-betting-primary">BetPal</h1>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Friendly betting with <span className="text-betting-secondary">tokens</span>, not money.
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Make friendly wagers with your friends using our token system. 
              Create bets, set conditions, and have fun without risking real money.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Login
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
              <h3 className="font-medium mb-2">Quick Demo</h3>
              <p className="text-sm text-gray-600">
                Login with any of these demo accounts: <br />
                <code className="bg-gray-100 px-1 py-0.5 rounded">user1@example.com</code>, 
                <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">user2@example.com</code>, 
                <code className="bg-gray-100 px-1 py-0.5 rounded ml-1">user3@example.com</code>
                <br />
                (any password will work)
              </p>
            </div>
          </div>
          
          <div className="flex-1 max-w-lg">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 transform rotate-1">
              <div className="pb-6 mb-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Water Drinking Challenge</h3>
                  <div className="token w-8 h-8">
                    <span className="token-text text-sm">20</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  I bet I can drink 3 liters of water in 24 hours straight!
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs ml-2">Judge</span>
                </div>
                <Button size="sm">Join Bet</Button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 transform -rotate-2 -mt-10 ml-12">
              <div className="pb-6 mb-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">No Social Media Week</h3>
                  <div className="token w-8 h-8">
                    <span className="token-text text-sm">50</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  I bet I can go a whole week without checking any social media apps!
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs ml-2">Self</span>
                </div>
                <Button size="sm" variant="outline">Participating</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-betting-primary/10 rounded-lg flex items-center justify-center mb-4">
              <div className="token w-8 h-8">
                <span className="token-text text-xs">T</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Token System</h3>
            <p className="text-gray-600">
              Start with 100 free tokens and wager them on bets. Win more tokens by winning bets.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-betting-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-betting-secondary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Friend Bets</h3>
            <p className="text-gray-600">
              Create bets with specific conditions and invite friends to participate.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-betting-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-betting-accent">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4l3 3"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Resolution System</h3>
            <p className="text-gray-600">
              Choose between self-resolution or appoint a judge to decide the outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
