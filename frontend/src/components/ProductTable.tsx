import { Table, TextInput, Paper, Stack, Container, Button, Group, Text, Skeleton, UnstyledButton, Center } from '@mantine/core';
import { useState, useEffect, useCallback } from 'react';
import { getToken, removeToken } from '../utils/auth';
import { useUser } from '../contexts/UserContext';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  stock: number;
}

interface ThProps {
  children: React.ReactNode;
  sortBy: keyof Product | null;
  onSort: (field: keyof Product) => void;
  reversed: boolean;
  width: string;
}

function Th({ children, sortBy, onSort, reversed, width }: ThProps) {
  const field = children?.toString().toLowerCase() as keyof Product;
  const Icon = sortBy === field ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <Table.Th style={{ width }}>
      <UnstyledButton onClick={() => onSort(field)} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
        <span style={{ flex: 1 }}>{children}</span>
        <Center>
          <Icon size={14} stroke={1.5} />
        </Center>
      </UnstyledButton>
    </Table.Th>
  );
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof Product>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
    url.searchParams.append('sort_by', sortBy);
    url.searchParams.append('sort_order', sortOrder);

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
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search with loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const handleSort = (field: keyof Product) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

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
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="20%">Name</Th>
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="50%">Description</Th>
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="15%">Price</Th>
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="15%">Stock</Th>
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

