import { Table, TextInput, Paper, Stack, Container, Button, Group, Text, Skeleton, UnstyledButton, Center } from '@mantine/core';
import { useState, useEffect, useCallback } from 'react';
import { getToken, removeToken } from '../utils/auth';
import { useUser } from '../contexts/UserContext';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { getApiUrl } from '@/utils/config';

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
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if we have a saved search
    return !!localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY);
  });
  const { setUser } = useUser();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, searchQuery);
    
    // Set searching state when query changes
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setIsLoading(false);
    }
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
      setIsSearching(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      setIsSearching(false);
      return;
    }

    // Get the API URL for products
    const apiUrl = getApiUrl('products/');
    
    // Check if the URL is absolute or relative
    const isAbsoluteUrl = apiUrl.startsWith('http://') || apiUrl.startsWith('https://');
    
    // Create the final URL with search parameter
    let finalUrl: string;
    
    if (isAbsoluteUrl) {
      // For absolute URLs, use URL constructor
      try {
        const url = new URL(apiUrl);
        url.searchParams.append('search', search);
        finalUrl = url.toString();
      } catch (error) {
        console.error('Error creating URL object:', error);
        // Fallback to manual query string construction
        finalUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}search=${encodeURIComponent(search)}`;
      }
    } else {
      // For relative URLs, manually construct the query string
      finalUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}search=${encodeURIComponent(search)}`;
    }
    
    console.log('Validating token with request to:', finalUrl);

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add credentials to ensure cookies are sent
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Log detailed error information
        console.error('Failed to fetch products:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // Try to get the response text for more details
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          removeToken();
          setUser(null);
          throw new Error('401 Unauthorized: Session expired');
        }
        
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      await new Promise(resolve => setTimeout(resolve, 250));
      
      setProducts(data);
      setIsSearching(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      
      // Check if the error is an instance of Error and contains 401
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        removeToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Effect to handle sorting whenever products, sortBy, or sortOrder changes
  useEffect(() => {
    if (products.length > 0) {
      setProducts(prevProducts => sortProducts(prevProducts, sortBy, sortOrder));
    }
  }, [sortBy, sortOrder, products.length]);

  // Helper function to sort products
  const sortProducts = (products: Product[], field: keyof Product, order: 'asc' | 'desc') => {
    return [...products].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Handle special cases for price
      if (field === 'price') {
        aValue = typeof aValue === 'string' ? parseFloat(aValue) : aValue;
        bValue = typeof bValue === 'string' ? parseFloat(bValue) : bValue;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      return 0;
    });
  };

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
    
    // Sort the existing products without fetching
    setProducts(prevProducts => sortProducts(prevProducts, field, newSortOrder));
  };

  const handleLogout = async () => {
    const token = getToken();
    
    try {
      // Call backend logout endpoint
      const logoutUrl = getApiUrl('logout');
      console.log('Logout request to:', logoutUrl);
      
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add credentials to ensure cookies are sent
        credentials: 'include'
      });
      
      // Log any non-OK responses but continue with logout
      if (!response.ok) {
        console.warn('Logout request failed:', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear storage and state regardless of server response
      // Clear all storage
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      // Clear authentication
      removeToken();
      
      // Clear application state
      setProducts([]);
      setUser(null);
      
      // Redirect to login
      window.location.href = '/';
    }
  };

  const handleSelect = async (productId: number) => {
    const token = getToken();
    
    try {
      const selectUrl = getApiUrl(`products/${productId}/select`);
      console.log('Select product request to:', selectUrl);
      
      const response = await fetch(selectUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add credentials to ensure cookies are sent
        credentials: 'include'
      });

      if (!response.ok) {
        // Log detailed error information
        console.error('Failed to select product:', {
          status: response.status,
          statusText: response.statusText,
          productId
        });
        
        // Try to get the response text for more details
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Failed to select product: ${response.status}`);
        } catch {
          // If parsing fails, use the status text
          throw new Error(`Failed to select product: ${response.status} ${response.statusText}`);
        }
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
      
      // Handle 401 Unauthorized
      if (error instanceof Error && 
          (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        removeToken();
        setUser(null);
        window.location.href = '/';
      }
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
    <Container size="md" h="100%" p={0}>
      <Stack h="100%" gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <TextInput
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Group gap="md">
              <Button onClick={handleLogout} color="red" size="sm">
                Logout
              </Button>
            </Group>
          </Group>
        </Paper>
        <Paper 
          shadow="xl"
          style={{ 
            flex: 1,
            overflow: 'auto',
            borderRadius: 0,
            margin: 0
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
                      backgroundColor: product.is_selected ? '#e6f7ff' : undefined,
                      opacity: isSearching ? 0.5 : 1,
                      transition: 'opacity 0.2s ease-in-out'
                    }}
                    onClick={() => handleSelect(product.id)}
                  >
                    <Table.Td style={{ width: '20%' }}>{product.name}</Table.Td>
                    <Table.Td style={{ width: '40%' }}>{product.description}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{formatPrice(product.price)}</Table.Td>
                    <Table.Td style={{ width: '15%' }}>{product.stock}</Table.Td>
                    <Table.Td style={{ width: '10%' }}>
                      {product.is_selected && (
                        <Text size="sm" c="blue">
                          Selected
                        </Text>
                      )}
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

