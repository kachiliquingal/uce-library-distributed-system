import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const AdminFines = () => {
  const [fines, setFines] = useState([]);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const token = localStorage.getItem('token');
      // Using direct port for development, or api gateway in production
      const url = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/fines`
        : `http://localhost:3006/api/fines`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFines(data);
      }
    } catch (error) {
      console.error('Error fetching fines:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Administración de Multas
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Vista global de todas las multas registradas en el sistema y su estado actual de pago.
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.dark' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Multa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Usuario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stripe Intent</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay multas registradas en el sistema.</TableCell>
              </TableRow>
            ) : (
              fines.map((fine) => (
                <TableRow key={fine.id} hover>
                  <TableCell>{fine.id.split('-')[0]}...</TableCell>
                  <TableCell>{fine.userId}</TableCell>
                  <TableCell>{new Date(fine.createdAt).toLocaleString()}</TableCell>
                  <TableCell>${fine.amount.toFixed(2)}</TableCell>
                  <TableCell>{fine.stripePaymentIntentId || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={fine.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'} 
                      color={fine.status === 'PAID' ? 'success' : 'error'} 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminFines;
