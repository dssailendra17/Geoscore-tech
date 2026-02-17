/**
 * Google Analytics 4 Integration
 * 
 * Access website analytics data
 * Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

export interface AnalyticsConfig {
  propertyId: string;
  credentials: {
    clientEmail: string;
    privateKey: string;
  };
}

export interface AnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  metrics: string[]; // e.g., ['activeUsers', 'sessions', 'pageviews']
  dimensions?: string[]; // e.g., ['country', 'city', 'deviceCategory']
  limit?: number;
}

export interface AnalyticsRow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

export class AnalyticsClient {
  private config: AnalyticsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseURL = 'https://analyticsdata.googleapis.com/v1beta';

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Get OAuth2 access token using service account
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Note: In production, use googleapis npm package for proper authentication
    throw new Error('OAuth2 authentication not implemented. Use googleapis package in production.');
  }

  /**
   * Run a report query
   */
  async runReport(query: AnalyticsQuery): Promise<AnalyticsRow[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseURL}/properties/${this.config.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{
            startDate: query.startDate,
            endDate: query.endDate,
          }],
          metrics: query.metrics.map(name => ({ name })),
          dimensions: query.dimensions?.map(name => ({ name })) || [],
          limit: query.limit || 10000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Analytics API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.rows || [];
  }

  /**
   * Get real-time data
   */
  async getRealtimeReport(metrics: string[], dimensions?: string[]): Promise<AnalyticsRow[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseURL}/properties/${this.config.propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metrics.map(name => ({ name })),
          dimensions: dimensions?.map(name => ({ name })) || [],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get realtime data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.rows || [];
  }

  /**
   * Get top pages
   */
  async getTopPages(startDate: string, endDate: string, limit: number = 10): Promise<any[]> {
    return this.runReport({
      startDate,
      endDate,
      metrics: ['screenPageViews', 'activeUsers'],
      dimensions: ['pagePath', 'pageTitle'],
      limit,
    });
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(startDate: string, endDate: string): Promise<any[]> {
    return this.runReport({
      startDate,
      endDate,
      metrics: ['sessions', 'activeUsers'],
      dimensions: ['sessionSource', 'sessionMedium'],
      limit: 100,
    });
  }

  /**
   * Get user demographics
   */
  async getUserDemographics(startDate: string, endDate: string): Promise<any[]> {
    return this.runReport({
      startDate,
      endDate,
      metrics: ['activeUsers'],
      dimensions: ['country', 'city', 'deviceCategory'],
      limit: 100,
    });
  }
}

