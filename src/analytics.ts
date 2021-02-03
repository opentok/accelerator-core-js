import OTKAnalytics from 'opentok-solutions-logging';

export class Analytics {
  private analytics: OTKAnalytics;

  /**
   * @param source Source of the logging event
   * @param sessionId Unique identifier of the session the event occurred in
   * @param connectionId Unique identifier of the connection on which the event occurred
   * @param apikey OpenTok API Key
   * @param applicationName Name of the application in which the event occurred
   */
  constructor(
    source: string,
    sessionId: string,
    connectionId: string,
    apikey: string,
    applicationName: string
  ) {
    const otkanalyticsData = {
      clientVersion: 'js-vsol-x.y.z', // x.y.z filled by npm build script
      source,
      componentId: 'acceleratorCore',
      name: applicationName || 'coreAccelerator',
      partnerId: apikey
    };

    this.analytics = new OTKAnalytics(otkanalyticsData);

    if (connectionId) {
      this.update(sessionId, connectionId, apikey);
    }
  }

  /**
   * Updates the session info of the OT Analytics Logging library
   * @param sessionId Unique identifier of the session the event occurred in
   * @param connectionId Unique identifier of the connection on which the event occurred
   * @param apikey OpenTok API Key
   */
  update(sessionId: string, connectionId: string, apiKey: string): void {
    if (sessionId && connectionId && apiKey) {
      const sessionInfo: Analytics.SessionInfo = {
        sessionId,
        connectionId,
        partnerId: apiKey
      };
      this.analytics.addSessionInfo(sessionInfo);
    }
  }

  /**
   * Logs an event in the OT Analytics Logging library
   * @param action The event that occurred
   * @param variation
   */
  log(action: string, variation: string): void {
    this.analytics.logEvent({ action, variation });
  }
}
