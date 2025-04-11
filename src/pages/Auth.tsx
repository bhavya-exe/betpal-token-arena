
import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

// Signup form schema
const signupFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type SignupFormValues = z.infer<typeof signupFormSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  
  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // Initialize signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);
  
  // Login submit handler
  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    
    try {
      await signIn(values.email, values.password);
      navigate('/');
    } catch (error) {
      // Error handling is done in the signIn function via toast
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Signup submit handler
  const handleSignupSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    
    try {
      await signUp(values.email, values.password, values.username);
      setActiveTab('login');
      loginForm.setValue('email', values.email);
    } catch (error) {
      // Error handling is done in the signUp function via toast
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="token">
              <span className="token-text">B</span>
            </div>
            <span className="text-2xl font-bold text-betting-primary">BetPal</span>
          </Link>
        </div>
        
        <Card>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Log in</CardTitle>
                <CardDescription className="text-center">
                  Enter your email and password to log in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Log in'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="signup">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign up</CardTitle>
                <CardDescription className="text-center">
                  Create an account to start placing bets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="betmaster" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Sign up'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
            
            <CardFooter className="flex justify-center p-4">
              <div className="text-center text-xs text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
