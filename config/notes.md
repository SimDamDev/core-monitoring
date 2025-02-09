# Notes pour J4 - Webhooks et Historique des Alertes

## Configuration Webhook
- URL par défaut : http://localhost:3000/webhooks
- Format du payload :
```json
{
  "type": "alert",
  "source": "cpu|mem",
  "value": 95.5,
  "threshold": 90,
  "timestamp": 1234567890
}
```
- Retry policy : 3 tentatives avec backoff exponentiel

## Stockage des Alertes
Table `alerts` dans SQLite :
```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  source TEXT NOT NULL,
  value REAL NOT NULL,
  threshold REAL NOT NULL,
  webhook_sent BOOLEAN DEFAULT 0
);
```

## UI Status
- Route `/status` pour afficher l'état des alertes
- Graphique temps réel avec Chart.js
- Filtrage par source et période

## Idées Futures
- Intégration Discord/Slack
- Notifications par email
- Dashboard personnalisable
- Export des alertes en CSV/PDF 