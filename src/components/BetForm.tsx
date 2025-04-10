
import React from 'react';
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
  opponent: z.string().optional(),
  judge: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const BetForm: React.FC = () => {
  const { createBet, currentUser } = useBetPal();
  const navigate = useNavigate();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      stake: 10,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, -8), // Tomorrow
      resolutionType: 'self',
      opponent: '',
      judge: '',
    },
  });
  
  // Submit handler
  const onSubmit = (values: FormValues) => {
    const deadlineDate = new Date(values.deadline);
    
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
                      <Input placeholder="Enter judge's username" {...field} />
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
