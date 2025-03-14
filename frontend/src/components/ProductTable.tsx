import { Table, TextInput, Paper, Stack, Container, Button } from '@mantine/core';
import { useState, useEffect } from 'react';
import { getToken, removeToken } from '../utils/auth';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = getToken();
    fetch('http://localhost:8000/api/products/', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        return response.json();
      })
      .then(data => setProducts(data || []))
      .catch(error => {
        console.error('Error fetching products:', error);
        setProducts([]);
      });
  }, []);

  const handleLogout = () => {
    removeToken();
    window.location.reload();
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Container fluid p={0} h="100vh">
      <Stack h="100%" gap={0}>
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <TextInput
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleLogout} color="red" variant="light">
              Logout
            </Button>
          </Stack>
        </Paper>
        <Paper 
          style={{ 
            flex: 1,
            overflow: 'auto',
            borderRadius: 0
          }}
        >
          <Table stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Stock</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProducts.map((product) => (
                <Table.Tr key={product.id}>
                    <Table.Td>{product.name}</Table.Td>
                    <Table.Td>{product.description}</Table.Td>
                    <Table.Td>{product.price}</Table.Td>
                    <Table.Td>{product.stock}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}        

