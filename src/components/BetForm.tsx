
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ParticipantSelector from './bet-form/ParticipantSelector';
import BetFormFields from './bet-form/BetFormFields';
import { useBet } from '@/contexts/BetContext';
import { useAuth } from '@/contexts/AuthContext';
import { BetCreateData } from '@/types/bet.types';

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
  judge_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const BetForm: React.FC = () => {
  const { createBet } = useBet();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<string[]>([]);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      stake: 10,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, -8), // Tomorrow
      resolutionType: 'self',
      judge_id: '',
    },
  });
  
  // Submit handler
  const onSubmit = async (values: FormValues) => {
    if (!user || !profile) {
      toast.error("You must be logged in to create a bet");
      return;
    }
    
    const deadlineDate = new Date(values.deadline).toISOString();
    
    if (participants.length === 0) {
      toast.error("You need to add at least one participant");
      return;
    }
    
    if (values.resolutionType === 'judge' && !values.judge_id) {
      toast.error("You need to select a judge");
      return;
    }
    
    try {
      // Create bet data with correct types
      const betData: BetCreateData = {
        title: values.title,
        description: values.description,
        stake: values.stake,
        deadline: deadlineDate,
        resolution_type: values.resolutionType,
        created_by: user.id,
        judge_id: values.resolutionType === 'judge' ? values.judge_id : null,
        participants: participants, // String array of usernames
        winner_id: null,
      };
      
      await createBet(betData);
      navigate('/bets');
    } catch (error) {
      console.error('Error creating bet:', error);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BetFormFields form={form} participants={participants} />
        
        <ParticipantSelector 
          participants={participants}
          setParticipants={setParticipants}
        />
        
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
