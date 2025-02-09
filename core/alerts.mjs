export class AlertChecker {
  static RULES = { cpu: 90, mem: 85 };

  constructor(logger = console, webhookUrl = null) {
    this.logger = logger;
    this.webhookUrl = webhookUrl;
  }

  async sendWebhook(metric) {
    if (!this.webhookUrl) return;
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'alert',
          source: metric.source,
          value: metric.value,
          threshold: AlertChecker.RULES[metric.source],
          timestamp: metric.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`[ALERT] Échec envoi webhook:`, error);
    }
  }

  async check(metric) {
    const threshold = AlertChecker.RULES[metric.source];
    if (!threshold) return false;
    
    if (metric.value > threshold) {
      this.logger.warn(`[ALERT] ${metric.source} at ${metric.value}%`);
      await this.sendWebhook(metric);
      return true;
    }
    return false;
  }
} 