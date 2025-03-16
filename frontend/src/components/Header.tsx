import { Container, Group, Text, Box } from '@mantine/core';
import { useUser } from '../contexts/UserContext';

export function Header() {
  const { user } = useUser();

  return (
    <Box component="header" style={{ borderBottom: '1px solid rgb(201, 201, 201)' }}>
      <Container size="xl" h="5vh" py="sm">
        <Group justify="space-between" mt="-1.5vh">
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
    </Box>
  );
} 