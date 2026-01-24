# Extract Weights Script

## Overview

The `extract-weights.ts` script extracts all weight measurements from stored Withings data files and outputs them in a simple timestamp-to-weight JSON format.

## Output Format

The script creates a JSON file with Unix timestamps as keys and weight in kilograms as values:

```json
{
  "1328425200": 77.8,
  "1328511600": 77.4,
  "1328598000": 77.2,
  "1328684400": 77.8,
  "1328857200": 79.0,
  ...
}
```

- **Key**: Unix timestamp (seconds since epoch)
- **Value**: Weight in kilograms (kg)

## Usage

```bash
npm run extract-weights <userid>
```

or

```bash
tsx scripts/extract-weights.ts <userid>
```

### Example

```bash
npm run extract-weights 1372655
```

## What It Does

1. **Finds all data files** for the specified user in `data/<userid>/`
2. **Extracts weight measurements** from each JSON file
   - Filters for measurement type 1 (weight)
   - Converts value using the unit multiplier (value * 10^unit)
3. **Sorts by timestamp** (chronological order)
4. **Outputs to** `output/<userid>-weights.json`

## Output Location

```
output/
  └── <userid>-weights.json
```

Example: `output/1372655-weights.json`

## Sample Output

```
📊 Extracting weight data for user: 1372655

Found 169 data file(s):

  📄 Processing 2012-02.json...
     ✓ Extracted 24 measurement(s)
  📄 Processing 2012-03.json...
     ✓ Extracted 31 measurement(s)
  ...

==================================================
✅ Success!
   Total measurements: 2869
   Output file: /path/to/output/1372655-weights.json
==================================================

📋 Sample data (first 5 entries):
   1328425200 (2012-02-05T07:00:00.000Z) => 77.8 kg
   1328511600 (2012-02-06T07:00:00.000Z) => 77.4 kg
   1328598000 (2012-02-07T07:00:00.000Z) => 77.2 kg
   1328684400 (2012-02-08T07:00:00.000Z) => 77.8 kg
   1328857200 (2012-02-10T07:00:00.000Z) => 79 kg
   ... and 2864 more entries
```

## Use Cases

This simplified format is useful for:

- **Data analysis** - Import into Excel, Python, R, etc.
- **Charting libraries** - Direct input to visualization tools
- **Data migration** - Export to other systems
- **Backup** - Lightweight backup of weight data
- **Machine learning** - Training data for models

## Converting Timestamps

In JavaScript/TypeScript:
```typescript
const date = new Date(parseInt(timestamp) * 1000);
console.log(date.toISOString()); // "2012-02-05T07:00:00.000Z"
```

In Python:
```python
from datetime import datetime
date = datetime.fromtimestamp(int(timestamp))
print(date.isoformat())  # "2012-02-05T07:00:00"
```

In Excel:
```
=(timestamp / 86400) + DATE(1970,1,1)
```

## Data Extraction Details

The script reads the raw Withings API response format:

```json
{
  "measuregrps": [
    {
      "date": 1328425200,  // ← Timestamp
      "measures": [
        {
          "value": 77800,    // ← Raw value
          "type": 1,         // ← Weight measurement
          "unit": -3         // ← Unit multiplier
        }
      ]
    }
  ]
}
```

**Conversion formula:**
```
weight_kg = value * 10^unit
weight_kg = 77800 * 10^(-3)
weight_kg = 77.8
```

## Error Handling

### User Not Found
```
❌ Error: Data directory not found for user 123456
   Expected: /path/to/data/123456
```

**Solution:** Ensure the user has data files in the `data/` directory.

### No Data Files
```
❌ Error: No data files found for user 1372655
```

**Solution:** Run `npm run fetch-year <username>` to fetch data first.

### Invalid JSON
```
📄 Processing 2024-01.json...
   ❌ Failed to process 2024-01.json: Unexpected token
```

**Solution:** Check the JSON file for corruption or delete and re-fetch.

## File Size

The output file is very compact:
- **~2,800 measurements** ≈ **70 KB**
- Much smaller than the original data files
- Only includes essential weight data

## Comparison with Original Format

**Original (raw Withings data):**
```json
{
  "userid": "1372655",
  "year": 2012,
  "month": 2,
  "fetchedAt": "2026-01-24T22:35:16.496Z",
  "measurements": {
    "updatetime": 1769294103,
    "timezone": "Europe/Berlin",
    "measuregrps": [...]
  }
}
```

**Extracted (simple format):**
```json
{
  "1328425200": 77.8,
  "1328511600": 77.4
}
```

## Integration Examples

### Load in Node.js
```typescript
import weights from './output/1372655-weights.json';

Object.entries(weights).forEach(([timestamp, weight]) => {
  console.log(`${new Date(+timestamp * 1000).toLocaleDateString()}: ${weight} kg`);
});
```

### Use in Data Analysis
```python
import json

with open('output/1372655-weights.json') as f:
    weights = json.load(f)

# Convert to pandas DataFrame
import pandas as pd
df = pd.DataFrame([
    {'date': pd.Timestamp(int(ts), unit='s'), 'weight': w}
    for ts, w in weights.items()
])

print(df.describe())
```

## Notes

- Timestamps are in UTC
- Weights are always in kilograms (kg)
- Only weight measurements (type 1) are extracted
- Data is sorted chronologically
- Duplicate timestamps are overwritten (last one wins)

## Related Scripts

- `fetch-year.ts` - Fetch data from Withings API
- `fetch-all-users.ts` - Fetch data for all users
- `refresh-tokens.ts` - Refresh OAuth tokens

## Troubleshooting

### Floating Point Precision

You may notice values like `77.60000000000001` due to JavaScript floating-point arithmetic. This is normal and can be fixed by rounding:

```typescript
const roundedWeight = Math.round(weight * 10) / 10; // Round to 1 decimal
```

### Large Files

For users with many years of data, the output file could be large. Consider:
- Filtering by date range
- Sampling (e.g., daily average instead of all measurements)
- Compressing the output file

## License

Part of the nextjs-withings-monitor project.
