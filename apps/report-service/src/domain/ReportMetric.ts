export interface MetricTag {
  [key: string]: string;
}

export interface MetricField {
  [key: string]: number | string | boolean;
}

export interface ReportMetric {
  measurement: string; // e.g., 'library_events', 'loans', 'fines'
  tags: MetricTag;     // indexed fields: e.g., { action: 'borrowed', bookId: '123', userId: '456' }
  fields: MetricField; // values: e.g., { count: 1, amount: 15.5 }
  timestamp?: Date;
}

export interface DailyLoanCount {
  date: string;
  count: number;
}

export interface TopBorrowedBook {
  bookId: string;
  title: string;
  borrowCount: number;
}

export interface FineRevenueSummary {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  pendingAmount: number;
}
