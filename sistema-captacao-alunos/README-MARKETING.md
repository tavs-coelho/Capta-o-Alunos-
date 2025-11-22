# Marketing Module - Real-time Event Monitoring

## Overview
The marketing module now supports real-time event monitoring by scraping event calendars from web pages. This allows the system to automatically detect upcoming academic events and trigger advertising campaigns.

## Features

### Real-time Event Scraping
- Fetches event data from configurable URLs
- Extracts event names and dates from HTML tables and lists
- Filters events occurring within the next 30 days
- Automatically formats and displays advertising opportunities

### Configuration

#### Environment Variables
- `EVENTS_URL`: URL to scrape for events (default: ENEM calendar)

Example in `.env` file:
```
EVENTS_URL=https://vestibular.brasilescola.uol.com.br/enem/calendario-enem.htm
```

### How It Works

1. **Automatic Monitoring**: Every 10 seconds, the system:
   - Fetches the event calendar from the configured URL
   - Parses HTML tables and lists for date patterns (DD/MM/YYYY or DD/MM/YY)
   - Extracts event names and dates
   - Filters events within the next 30 days

2. **Output Format**: When events are found, the system displays:
   ```
   [MARKETING] 🎯 OPORTUNIDADE DE ANÚNCIO: [Event Name] em [Date]
   ```

3. **Error Handling**: If the URL cannot be accessed or parsing fails:
   - Logs detailed error messages with stack traces
   - Returns an empty array (continues with fixed calendar)
   - Maintains system stability

### Backward Compatibility
The system continues to monitor the fixed calendar (`calendarioAcademico`) even when real-time scraping is active. Both systems work in parallel.

## Usage

### Basic Usage
The module starts automatically when required:
```javascript
const marketing = require('./marketing.js');
```

### Manual Event Fetching
You can also manually call the function:
```javascript
const { buscarDatasReais } = require('./marketing.js');

async function checkEvents() {
  const events = await buscarDatasReais();
  console.log(`Found ${events.length} events`);
  events.forEach(event => {
    console.log(`${event.nome} - ${event.dataFormatada}`);
  });
}
```

## Technical Details

### Constants
- `MIN_EVENT_NAME_LENGTH`: 5 characters (minimum event name length)
- `MAX_EVENT_NAME_LENGTH`: 100 characters (maximum event name length)
- `DATE_REGEX`: Pattern to match dates in DD/MM/YYYY or DD/MM/YY format

### Dependencies
- `axios`: HTTP client for fetching web pages
- `cheerio`: HTML parser for extracting event data
- `node-cron`: Scheduler for periodic checks

## Troubleshooting

### No events found
- Check if the EVENTS_URL is accessible
- Verify the HTML structure of the target page
- Review the console logs for detailed error messages

### Date parsing issues
- Ensure dates are in DD/MM/YYYY or DD/MM/YY format
- Check the regex pattern in DATE_REGEX constant
- Review stack traces for conversion errors

## Future Improvements
- Support for multiple event sources
- Configurable date range (currently fixed at 30 days)
- Custom date format patterns
- Integration with actual Facebook Ads API
