import { Paper, Stack, TextInput, Button, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { ProductTable } from './ProductTable';
import { setToken, isValidToken } from '../utils/auth';

interface LoginForm {
  username: string;
  email: string;
}

export function LoginContainer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const valid = await isValidToken();
      setIsLoggedIn(valid);
      setIsLoading(false);
    };
    checkToken();
  }, []);

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
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      setToken(data.token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
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
            />
            <TextInput
              label="Email"
              placeholder="your@email.com"
              styles={{
                label: { fontSize: '14px', marginBottom: '5px' },
                input: { padding: '12px', fontSize: '14px' }
              }}
              {...form.getInputProps('email')}
            />
            <Button 
              type="submit" 
              fullWidth
              h={42}
              mt={10}
              fz={14}
            >
              Login
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
} 