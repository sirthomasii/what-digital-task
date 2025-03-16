'use client';

import { Box } from '@mantine/core';
import { LoginContainer } from '@/components/LoginContainer';

export default function Home() {
  return (
    <Box 
      w="100%" 
      h="95vh" 
      bg="#f8f9fa"
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoginContainer />
    </Box>
  );
}
