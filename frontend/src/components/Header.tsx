import { Container, Group, Text, Box } from '@mantine/core';
import { useUser } from '../contexts/UserContext';

export function Header() {
  const { user } = useUser();

  return (
    <Box component="header" style={{ borderBottom: '1px solid rgb(201, 201, 201)' }}>
      <Container size="xl" h="6vh">
        <Group justify="space-between" h="100%" align="center">
          <Text size="md" fw={1000}>What Digital Task</Text>
          {user && (
            <Box>
              <Text size="sm" c="dimmed">
                {user.email}
              </Text>
            </Box>
          )}
        </Group>
      </Container>
    </Box>
  );
} 