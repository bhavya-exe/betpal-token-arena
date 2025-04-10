
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBetPal } from '@/contexts/BetPalContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { currentUser, logout, getUnreadNotificationsCount, isLoggedIn } = useBetPal();
  const unreadCount = getUnreadNotificationsCount();
  
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="token">
            <span className="token-text">B</span>
          </div>
          <span className="text-2xl font-bold text-betting-primary">BetPal</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-gray-700 hover:text-betting-primary font-medium">
            Dashboard
          </Link>
          <Link to="/bets" className="text-gray-700 hover:text-betting-primary font-medium">
            Bets
          </Link>
          <Link to="/profile" className="text-gray-700 hover:text-betting-primary font-medium">
            Profile
          </Link>
        </nav>
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-betting-primary/10 px-3 py-1.5 rounded-full">
              <div className="token w-6 h-6">
                <span className="token-text text-xs">T</span>
              </div>
              <span className="ml-2 font-semibold">{currentUser?.tokenBalance || 0}</span>
            </div>
            
            <Link to="/create-bet">
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1">
                <Plus size={16} />
                <span>New Bet</span>
              </Button>
            </Link>
            
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-betting-primary text-white">
                      {currentUser?.username.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full flex items-center">
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
