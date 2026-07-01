import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock');

const MyFines = () => {
  const [fines, setFines] = useState([]);
  const [selectedFine, setSelectedFine] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const token = localStorage.getItem('token');
      // Using direct port for development, or api gateway in production
      const url = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/fines/user/${user.id}`
        : `http://localhost:3006/api/fines/user/${user.id}`;

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

  const handlePayClick = async (fine) => {
    try {
      const token = localStorage.getItem('token');
      const url = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/fines/${fine.id}/pay`
        : `http://localhost:3006/api/fines/${fine.id}/pay`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setSelectedFine(fine);
        setIsPaymentDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret('');
    setSelectedFine(null);
    fetchFines(); // Refresh the list
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Mis Multas
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Multa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motivo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No tienes multas registradas.</TableCell>
              </TableRow>
            ) : (
              fines.map((fine) => (
                <TableRow key={fine.id} hover>
                  <TableCell>{fine.id.split('-')[0]}...</TableCell>
                  <TableCell>{new Date(fine.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{fine.reason}</TableCell>
                  <TableCell>${fine.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={fine.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'} 
                      color={fine.status === 'PAID' ? 'success' : 'error'} 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    {fine.status === 'UNPAID' && (
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        size="small"
                        onClick={() => handlePayClick(fine)}
                      >
                        Pagar Ahora
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Dialog */}
      <Dialog 
        open={isPaymentDialogOpen} 
        onClose={() => setIsPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', pb: 2 }}>
          Pagar Multa
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {clientSecret && (
            <Elements options={{ clientSecret }} stripe={stripePromise}>
              <CheckoutForm 
                onSuccess={handlePaymentSuccess} 
                onCancel={() => setIsPaymentDialogOpen(false)} 
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MyFines;
