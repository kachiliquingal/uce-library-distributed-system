export const LOAN_API_URL = import.meta.env.VITE_LOAN_API_URL || '/api/loans';

export const loanApi = {
  borrowBook: async (userId, isbn, bookTitle, faculty, token) => {
    const res = await fetch(`${LOAN_API_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId, isbn, bookTitle, faculty })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to borrow book');
    }
    return res.json();
  },

  returnBook: async (loanId, token) => {
    const res = await fetch(`${LOAN_API_URL}/${loanId}/return`, {
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
    const res = await fetch(`${LOAN_API_URL}/user/${userId}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch user loans');
    return res.json();
  },

  getAllLoans: async (activeOnly = false, page = 1, limit = 10, token) => {
    const res = await fetch(`${LOAN_API_URL}/?activeOnly=${activeOnly}&page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch all loans');
    return res.json();
  }
};
