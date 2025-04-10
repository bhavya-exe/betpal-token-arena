
import React, { useState } from 'react';
import { X, PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormLabel } from '@/components/ui/form';
import { toast } from 'sonner';

// Mock user data for demonstration - in a real app, this would come from the context or an API
const mockUsers = [
  { id: 'user1', username: 'user1' },
  { id: 'user2', username: 'user2' },
  { id: 'user3', username: 'user3' },
  { id: 'john_doe', username: 'john_doe' },
  { id: 'jane_smith', username: 'jane_smith' },
];

interface ParticipantSelectorProps {
  participants: string[];
  setParticipants: React.Dispatch<React.SetStateAction<string[]>>;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ 
  participants, 
  setParticipants 
}) => {
  const [participantInput, setParticipantInput] = useState('');
  const [isParticipantPopoverOpen, setIsParticipantPopoverOpen] = useState(false);

  const addParticipant = (username: string) => {
    // Check if username exists
    const userExists = mockUsers.some(user => user.username === username);
    if (!userExists) {
      toast.error(`User '${username}' not found`);
      return;
    }
    
    // Check if already added
    if (participants.includes(username)) {
      toast.error(`'${username}' is already added`);
      return;
    }
    
    // Add participant
    setParticipants([...participants, username]);
    setParticipantInput('');
    toast.success(`Added ${username} to the bet`);
    setIsParticipantPopoverOpen(false);
  };

  const removeParticipant = (username: string) => {
    setParticipants(participants.filter(p => p !== username));
  };

  return (
    <div>
      <FormLabel>Participants</FormLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {participants.map(participant => (
          <div 
            key={participant} 
            className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-md"
          >
            <span className="mr-1">{participant}</span>
            <button 
              type="button" 
              onClick={() => removeParticipant(participant)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 items-center">
        <Popover open={isParticipantPopoverOpen} onOpenChange={setIsParticipantPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-9 flex items-center gap-1"
            >
              <PlusCircle size={16} />
              <span>Add Friends</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="start">
            <Command>
              <CommandInput 
                placeholder="Search username..." 
                value={participantInput}
                onValueChange={setParticipantInput}
              />
              <CommandEmpty>No user found</CommandEmpty>
              <CommandGroup>
                {mockUsers
                  .filter(user => 
                    user.username.toLowerCase().includes(participantInput.toLowerCase()) &&
                    !participants.includes(user.username)
                  )
                  .map(user => (
                    <CommandItem 
                      key={user.id}
                      onSelect={() => addParticipant(user.username)}
                    >
                      <User size={16} className="mr-2" />
                      {user.username}
                    </CommandItem>
                  ))
                }
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ParticipantSelector;
