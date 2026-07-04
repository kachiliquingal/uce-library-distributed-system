import { Request, Response } from 'express';
import { AnalyticsUseCase } from '../../../application/use-cases/AnalyticsUseCase';
import { ExportReportUseCase } from '../../../application/use-cases/ExportReportUseCase';
import { ExportOptions, ExportPeriod, ExportType, ExportFormat } from '../../../domain/ExportTypes';
import { logger } from '../../../utils/logger';

export class ReportController {
  private exportUseCase: ExportReportUseCase;

  constructor(private analyticsUseCase: AnalyticsUseCase) {
    this.exportUseCase = new ExportReportUseCase(this.analyticsUseCase);
  }

  async getLoansPerDay(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(String(req.query.days), 10) : 7;
      const data = await this.analyticsUseCase.getLoansPerDay(days);
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error in getLoansPerDay controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTopBorrowedBooks(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
      const data = await this.analyticsUseCase.getTopBorrowedBooks(limit);
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error in getTopBorrowedBooks controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getActiveUsersCount(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
      const data = await this.analyticsUseCase.getActiveUsersCount(days);
      res.status(200).json({ count: data, periodDays: days });
    } catch (error) {
      logger.error('Error in getActiveUsersCount controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFineRevenueSummary(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.analyticsUseCase.getFineRevenueSummary();
      res.status(200).json(data);
    } catch (error) {
      logger.error('Error in getFineRevenueSummary controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const [loansPerDay, topBooks, activeUsers, fineRevenue] = await Promise.all([
        this.analyticsUseCase.getLoansPerDay(7),
        this.analyticsUseCase.getTopBorrowedBooks(5),
        this.analyticsUseCase.getActiveUsersCount(30),
        this.analyticsUseCase.getFineRevenueSummary()
      ]);

      res.status(200).json({
        loansPerDay,
        topBooks,
        activeUsers,
        fineRevenue,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getSummary controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordEvent(req: Request, res: Response): Promise<void> {
    try {
      const { measurement, tags = {}, fields = {} } = req.body;
      if (!measurement) {
        res.status(400).json({ error: 'measurement is required' });
        return;
      }
      await this.analyticsUseCase.recordEvent(measurement, tags, fields);
      res.status(201).json({ message: 'Metric recorded successfully' });
    } catch (error) {
      logger.error('Error in recordEvent controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const options: ExportOptions = {
        period: (req.query.period as ExportPeriod) || 'week',
        type: (req.query.type as ExportType) || 'summary',
        format: (req.query.format as ExportFormat) || 'pdf',
        faculty: String(req.query.faculty || 'Todas las Facultades'),
        requestedBy: String(req.query.requestedBy || 'Administrador UCE')
      };
      await this.exportUseCase.exportReport(res, options);
    } catch (error) {
      logger.error('Error in exportReport controller:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}

