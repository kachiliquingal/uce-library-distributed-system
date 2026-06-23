export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';

export const loanApi = {
  borrowBook: async (userId, isbn, token) => {
    const res = await fetch(`${API_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId, isbn })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to borrow book');
    }
    return res.json();
  },

  returnBook: async (loanId, token) => {
    const res = await fetch(`${API_URL}/api/loans/${loanId}/return`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to return book');
    }
    return res.json();
  },

  getUserLoans: async (userId, page = 1, limit = 10, token) => {
    const res = await fetch(`${API_URL}/api/loans/user/${userId}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch user loans');
    return res.json();
  },

  getAllLoans: async (activeOnly = false, page = 1, limit = 10, token) => {
    const res = await fetch(`${API_URL}/api/loans?activeOnly=${activeOnly}&page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch all loans');
    return res.json();
  }
};
