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
  is_selected: boolean;
  selected_by_username: string | null;
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

// Constants for localStorage keys
const STORAGE_KEYS = {
  SEARCH_QUERY: 'productTable_searchQuery',
  SORT_BY: 'productTable_sortBy',
  SORT_ORDER: 'productTable_sortOrder',
} as const;

export function ProductTable() {
  // Initialize state from localStorage if available
  const [searchQuery, setSearchQuery] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY) || ''
  );
  const [sortBy, setSortBy] = useState<keyof Product>(() => 
    (localStorage.getItem(STORAGE_KEYS.SORT_BY) as keyof Product) || 'name'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => 
    (localStorage.getItem(STORAGE_KEYS.SORT_ORDER) as 'asc' | 'desc') || 'asc'
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if we have a saved search
    return !!localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY);
  });
  const { user, setUser } = useUser();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_ORDER, sortOrder);
  }, [sortOrder]);

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(numPrice) ? `$${numPrice.toFixed(2)}` : '$0.00';
  };

  const fetchProducts = useCallback(async (search?: string) => {
    // Don't fetch if there's no search query
    if (!search?.trim()) {
      setIsLoading(false);
      setProducts([]);
      return;
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const url = new URL('http://localhost:8000/api/products/');
    url.searchParams.append('search', search);
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
      if (error instanceof Error && error.message.includes('401')) {
        removeToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder, setUser]);

  // Remove initial fetch effect since we only want to fetch on search
  
  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const handleSort = (field: keyof Product) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    const newSortOrder = isAsc ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setSortBy(field);
  };

  const handleLogout = () => {
    // Clear localStorage on logout
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    removeToken();
    setUser(null);
    window.location.reload();
  };

  const handleSelect = async (productId: number) => {
    const token = getToken();
    
    try {
      const response = await fetch(`http://localhost:8000/api/products/${productId}/select/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select product');
      }

      // Update the product locally
      const updatedProduct = await response.json();
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId ? updatedProduct : product
        )
      );
    } catch (error) {
      console.error('Error selecting product:', error);
    }
  };

  const LoadingRows = () => (
    <>
      {[...Array(15)].map((_, index) => (
        <Table.Tr key={`skeleton-${index}`}>
          <Table.Td style={{ width: '20%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '40%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '15%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '15%' }}>
            <Skeleton height={20} radius="sm" animate />
          </Table.Td>
          <Table.Td style={{ width: '10%' }}>
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
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="40%">Description</Th>
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="15%">Price</Th>
                <Th sortBy={sortBy} onSort={handleSort} reversed={sortOrder === 'desc'} width="15%">Stock</Th>
                <Table.Th style={{ width: '10%' }}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <LoadingRows />
              ) : (
                products.map((product) => (
                  <Table.Tr 
                    key={product.id}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: product.is_selected ? '#e6f7ff' : undefined
                    }}
                    onClick={() => handleSelect(product.id)}
                  >
                    <Table.Td style={{ width: '20%' }}>{product.name}</Table.Td>
                    <Table.Td style={{ width: '40%' }}>{product.description}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{formatPrice(product.price)}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{product.stock}</Table.Td>
                    <Table.Td style={{ width: '10%' }}>
                      {product.selected_by_username ? (
                        <Text size="sm" c={product.is_selected ? "blue" : "red"}>
                          {product.is_selected ? "Selected" : `By ${product.selected_by_username}`}
                        </Text>
                      ) : null}
                    </Table.Td>
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

