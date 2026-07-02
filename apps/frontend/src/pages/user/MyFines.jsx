import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../../components/CheckoutForm';
import { useAuthStore } from '../../store/authStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock');

const MyFines = () => {
  const [fines, setFines] = useState([]);
  const [clientSecret, setClientSecret] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { user, token } = useAuthStore();
  const currentUserId = user?.id || user?.userId;

  useEffect(() => {
    fetchFines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fetchFines = async () => {
    try {
      if (!currentUserId) return;
      const FINE_API_URL = import.meta.env.VITE_FINE_API_URL || '/api/fines';
      const url = `${FINE_API_URL}/user/${currentUserId}`;
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
      const FINE_API_URL = import.meta.env.VITE_FINE_API_URL || '/api/fines';
      const url = `${FINE_API_URL}/${fine.id}/pay`;
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
        setIsPaymentDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret('');
    fetchFines(); // Refresh the list
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-900 mb-6">Mis Multas</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">ID Multa</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Motivo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium">No tienes multas registradas.</td>
                </tr>
              ) : (
                fines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{fine.id.split('-')[0]}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(fine.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fine.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${fine.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                        fine.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {fine.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {fine.status === 'UNPAID' && (
                        <button 
                          onClick={() => handlePayClick(fine)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors"
                        >
                          Pagar Ahora
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Dialog */}
      {isPaymentDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsPaymentDialogOpen(false)}>
              <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-visible shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-indigo-900 px-6 py-4">
                <h3 className="text-xl leading-6 font-bold text-white">
                  Pagar Multa Segura
                </h3>
              </div>
              <div className="bg-white px-6 pt-5 pb-6 sm:p-6 sm:pb-4">
                {clientSecret && (
                  <Elements options={{ clientSecret }} stripe={stripePromise}>
                    <CheckoutForm 
                      onSuccess={handlePaymentSuccess} 
                      onCancel={() => setIsPaymentDialogOpen(false)} 
                    />
                  </Elements>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFines;
