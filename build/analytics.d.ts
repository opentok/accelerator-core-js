export declare class Analytics {
    private analytics;
    /**
     * @param source Source of the logging event
     * @param sessionId Unique identifier of the session the event occurred in
     * @param connectionId Unique identifier of the connection on which the event occurred
     * @param apikey OpenTok API Key
     * @param applicationName Name of the application in which the event occurred
     */
    constructor(source: string, sessionId: string, connectionId: string, apikey: string, applicationName: string);
    /**
     * Updates the session info of the OT Analytics Logging library
     * @param sessionId Unique identifier of the session the event occurred in
     * @param connectionId Unique identifier of the connection on which the event occurred
     * @param apikey OpenTok API Key
     */
    update(sessionId: string, connectionId: string, apiKey: string): void;
    /**
     * Logs an event in the OT Analytics Logging library
     * @param action The event that occurred
     * @param variation
     */
    log(action: string, variation: string): void;
}
