import { AppShell, Container, Group, Text, Box } from '@mantine/core';
import { useUser } from '../contexts/UserContext';

export function Header() {
  const { user } = useUser();

  return (
    <AppShell.Header>
      <Container size="xl" h="100%" py="sm">
        <Group justify="space-between" h="100%">
          <Text size="lg" fw={700}>What Digital Task</Text>
          {user && (
            <Box>
              <Text size="sm" c="dimmed">
                {user.email}
              </Text>
            </Box>
          )}
        </Group>
      </Container>
    </AppShell.Header>
  );
} 