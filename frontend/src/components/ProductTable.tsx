import { Table, TextInput, Paper, Stack, Container, Button, Group, Text, Skeleton } from '@mantine/core';
import { useState, useEffect, useCallback } from 'react';
import { getToken, removeToken } from '../utils/auth';
import { useUser } from '../contexts/UserContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  stock: number;
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useUser();

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(numPrice) ? `$${numPrice.toFixed(2)}` : '$0.00';
  };

  const fetchProducts = useCallback(async (search?: string) => {
    const token = getToken();
    const url = new URL('http://localhost:8000/api/products/');
    if (search) {
      url.searchParams.append('search', search);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Ensure loading state shows for at least 500ms
      await new Promise(resolve => setTimeout(resolve, 250));
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search with loading state
  useEffect(() => {
    setIsLoading(true); // Set loading state when search changes
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 1000); // Increased to 1 second

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    window.location.reload();
  };

  const LoadingRows = () => (
    <>
      {[...Array(15)].map((_, index) => (
        <Table.Tr key={`skeleton-${index}`}>
          <Table.Td style={{ width: '20%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '50%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '15%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '15%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );

  return (
    <Container size="md" p="md" h="100vh">
      <Stack h="100%" gap={0}>
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <TextInput
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Group gap="md">
              {user && (
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
              )}
              <Button onClick={handleLogout} color="red" variant="light">
                Logout
              </Button>
            </Group>
          </Group>
        </Paper>
        <Paper 
          style={{ 
            flex: 1,
            overflow: 'auto',
            borderRadius: 0
          }}
        >
          <Table stickyHeader horizontalSpacing="md" verticalSpacing="sm" layout="fixed" style={{ tableLayout: 'fixed', width: '100%' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '20%' }}>Name</Table.Th>
                <Table.Th style={{ width: '50%' }}>Description</Table.Th>
                <Table.Th style={{ width: '15%' }}>Price</Table.Th>
                <Table.Th style={{ width: '15%' }}>Stock</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <LoadingRows />
              ) : (
                products.map((product) => (
                  <Table.Tr key={product.id}>
                    <Table.Td style={{ width: '20%' }}>{product.name}</Table.Td>
                    <Table.Td style={{ width: '50%' }}>{product.description}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{formatPrice(product.price)}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{product.stock}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}        

