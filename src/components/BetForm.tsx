
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBetPal } from '@/contexts/BetPalContext';
import { useNavigate } from 'react-router-dom';
import { X, PlusCircle, User } from 'lucide-react';
import { toast } from 'sonner';
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

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  stake: z.number().min(1, { message: 'Stake must be at least 1 token' }),
  deadline: z.string().refine(value => {
    const date = new Date(value);
    const now = new Date();
    return date > now;
  }, { message: 'Deadline must be in the future' }),
  resolutionType: z.enum(['self', 'judge']),
  judge: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const BetForm: React.FC = () => {
  const { createBet, currentUser } = useBetPal();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [isParticipantPopoverOpen, setIsParticipantPopoverOpen] = useState(false);
  const [isJudgePopoverOpen, setIsJudgePopoverOpen] = useState(false);
  
  // Mock user data for demonstration - in a real app, this would come from the context or an API
  const mockUsers = [
    { id: 'user1', username: 'user1' },
    { id: 'user2', username: 'user2' },
    { id: 'user3', username: 'user3' },
    { id: 'john_doe', username: 'john_doe' },
    { id: 'jane_smith', username: 'jane_smith' },
  ];
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      stake: 10,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, -8), // Tomorrow
      resolutionType: 'self',
      judge: '',
    },
  });

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
  
  // Submit handler
  const onSubmit = (values: FormValues) => {
    const deadlineDate = new Date(values.deadline);
    
    if (participants.length === 0) {
      toast.error("You need to add at least one participant");
      return;
    }
    
    if (values.resolutionType === 'judge' && !values.judge) {
      toast.error("You need to select a judge");
      return;
    }
    
    createBet({
      title: values.title,
      description: values.description,
      stake: values.stake,
      deadline: deadlineDate,
      resolutionType: values.resolutionType,
      createdBy: currentUser?.id || '',
      judge: values.resolutionType === 'judge' ? values.judge : undefined,
    });
    
    navigate('/bets');
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What's the bet about?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the conditions of the bet..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="stake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stake (Tokens)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-[50%] transform -translate-y-1/2">
                        <div className="token w-5 h-5">
                          <span className="token-text text-[10px]">T</span>
                        </div>
                      </div>
                      <Input
                        type="number"
                        className="pl-10"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resolutionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How will this bet be resolved?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self">Self-resolved (both parties agree)</SelectItem>
                      <SelectItem value="judge">Judge-based (third party decides)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('resolutionType') === 'judge' && (
              <FormField
                control={form.control}
                name="judge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judge (Username)</FormLabel>
                    <FormControl>
                      <Popover open={isJudgePopoverOpen} onOpenChange={setIsJudgePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "Select a judge..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" side="bottom" align="start">
                          <Command>
                            <CommandInput placeholder="Search username..." />
                            <CommandEmpty>No user found</CommandEmpty>
                            <CommandGroup>
                              {mockUsers
                                .filter(user => !participants.includes(user.username))
                                .map(user => (
                                  <CommandItem 
                                    key={user.id}
                                    onSelect={() => {
                                      field.onChange(user.username);
                                      setIsJudgePopoverOpen(false);
                                    }}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => navigate('/bets')}>
            Cancel
          </Button>
          <Button type="submit">Create Bet</Button>
        </div>
      </form>
    </Form>
  );
};

export default BetForm;
