import { Table, TextInput, Paper, Stack, Container } from '@mantine/core';
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/api/products/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => setProducts(data || []))
      .catch(error => {
        console.error('Error fetching products:', error);
        setProducts([]);
      });
  }, []);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Container fluid p={0} h="100vh">
      <Stack h="100%" gap={0}>
        <Paper p="md" withBorder>
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProducts.map((product) => (
                <Table.Tr key={product.id}>
                  <Table.Td>{product.name}</Table.Td>
                  <Table.Td>{product.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}        
