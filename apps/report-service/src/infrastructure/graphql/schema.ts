import { buildSchema } from 'graphql';
import { AnalyticsUseCase } from '../../application/use-cases/AnalyticsUseCase';

export const buildGraphQLSchema = () => {
  return buildSchema(`
    type DailyLoanCount {
      date: String!
      count: Int!
    }

    type TopBorrowedBook {
      bookId: String!
      title: String!
      borrowCount: Int!
    }

    type FineRevenueSummary {
      totalRevenue: Float!
      paidCount: Int!
      pendingCount: Int!
      pendingAmount: Float!
    }

    type Query {
      loansPerDay(days: Int): [DailyLoanCount!]!
      topBorrowedBooks(limit: Int): [TopBorrowedBook!]!
      activeUsersCount(days: Int): Int!
      fineRevenueSummary: FineRevenueSummary!
    }
  `);
};

export const buildGraphQLRoot = (analyticsUseCase: AnalyticsUseCase) => {
  return {
    loansPerDay: async ({ days }: { days?: number }) => {
      return analyticsUseCase.getLoansPerDay(days || 7);
    },
    topBorrowedBooks: async ({ limit }: { limit?: number }) => {
      return analyticsUseCase.getTopBorrowedBooks(limit || 5);
    },
    activeUsersCount: async ({ days }: { days?: number }) => {
      return analyticsUseCase.getActiveUsersCount(days || 30);
    },
    fineRevenueSummary: async () => {
      return analyticsUseCase.getFineRevenueSummary();
    }
  };
};
