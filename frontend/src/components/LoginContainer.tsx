import { Paper, Stack, TextInput, Button, Title, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect, useCallback } from 'react';
import { ProductTable } from './ProductTable';
import { setToken, isValidToken, getUser } from '../utils/auth';
import { useUser } from '../contexts/UserContext';
import { getApiUrl } from '@/utils/config';
import { IconAlertCircle } from '@tabler/icons-react';

interface LoginForm {
  username: string;
  email: string;
}

export function LoginContainer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useUser();

  const checkToken = useCallback(async () => {
    const valid = await isValidToken();
    if (valid) {
      const userData = getUser();
      if (userData) {
        setUser(userData);
      }
    }
    setIsLoggedIn(valid);
    setIsLoading(false);
  }, [setUser]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const form = useForm<LoginForm>({
    initialValues: {
      username: '',
      email: '',
    },
    validate: {
      username: (value) => (value.length < 2 ? 'Username must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: LoginForm) => {
    setLoginError(null);
    setIsSubmitting(true);
    
    try {
      const apiUrl = getApiUrl('login');
      console.log('Login request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        // Add credentials to ensure cookies are sent
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Login request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        let errorMessage = `Login failed with status ${response.status}. Please try again.`;
        
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          if (response.status === 502) {
            errorMessage = 'Backend server is unavailable. Please try again later or contact support.';
          }
        } catch (e) {
          console.error('Could not read error response:', e);
        }
        
        setLoginError(errorMessage);
        return;
      }
      
      const data = await response.json();
      
      if (!data.token || !data.username || !data.email) {
        console.error('Invalid login response:', data);
        setLoginError('Invalid response from server. Please try again.');
        return;
      }
      
      const userData = {
        username: data.username,
        email: data.email
      };
      
      setToken(data.token, userData);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (isLoggedIn) {
    return <ProductTable />;
  }

  return (
    <Paper
      w={400}
      p={30}
      bg="white"
      radius="md"
      withBorder
      shadow="sm"
    >
      <Stack gap={20}>
        <Title order={2} ta="center" c="#1a1b1e" fz={24} m={0}>
          Login
        </Title>
        
        {loginError && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Login Error" 
            color="red" 
            variant="filled"
          >
            {loginError}
          </Alert>
        )}
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap={15}>
            <TextInput
              label="Username"
              placeholder="Your username"
              styles={{
                label: { fontSize: '14px', marginBottom: '5px' },
                input: { padding: '12px', fontSize: '14px' }
              }}
              {...form.getInputProps('username')}
              disabled={isSubmitting}
            />
            <TextInput
              label="Email"
              placeholder="your@email.com"
              styles={{
                label: { fontSize: '14px', marginBottom: '5px' },
                input: { padding: '12px', fontSize: '14px' }
              }}
              {...form.getInputProps('email')}
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              fullWidth
              h={42}
              mt={10}
              fz={14}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </Stack>
        </form>
        
        <Text size="xs" ta="center" c="dimmed" mt={10}>
          For testing, use any username (min 2 chars) and valid email format
        </Text>
      </Stack>
    </Paper>
  );
} 