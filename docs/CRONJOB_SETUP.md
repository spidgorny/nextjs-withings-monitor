# Cronjob Setup Guide

This guide explains how to set up automated data fetching for all users using a cronjob.

## Overview

The `scripts/fetch-all-users.ts` script fetches the current month's data for all users configured in `.env.json`. This
script is designed to be run periodically (e.g., daily) to keep your data up-to-date automatically.

## Features

- Fetches data for all users in `.env.json` sequentially
- Automatically refreshes expired tokens and updates `.env.json`
- Provides detailed logging for monitoring
- Handles errors gracefully, continuing with other users if one fails
- Adds delays between requests to avoid rate limiting

## Manual Usage

You can run the script manually at any time:

```bash
npm run fetch-all
```

Or directly with tsx:

```bash
npx tsx scripts/fetch-all-users.ts
```

## Setting up a Cronjob

### On Linux/macOS

1. Open your crontab configuration:
   ```bash
   crontab -e
   ```

2. Add one of the following lines depending on your preferred schedule:

   **Run daily at 3:00 AM:**
   ```
   0 3 * * * cd /Users/depidsvy/dev/nextjs-withings-monitor && /usr/local/bin/npm run fetch-all >> /tmp/withings-fetch.log 2>&1
   ```

   **Run every 6 hours:**
   ```
   0 */6 * * * cd /Users/depidsvy/dev/nextjs-withings-monitor && /usr/local/bin/npm run fetch-all >> /tmp/withings-fetch.log 2>&1
   ```

   **Run daily at midnight:**
   ```
   0 0 * * * cd /Users/depidsvy/dev/nextjs-withings-monitor && /usr/local/bin/npm run fetch-all >> /tmp/withings-fetch.log 2>&1
   ```

3. Save and exit the editor

4. Verify your crontab is set up correctly:
   ```bash
   crontab -l
   ```

### Important Notes

- Replace `/Users/depidsvy/dev/nextjs-withings-monitor` with the actual path to your project
- Replace `/usr/local/bin/npm` with the full path to npm on your system (find it with `which npm`)
- The `>> /tmp/withings-fetch.log 2>&1` part logs all output to a file for debugging
- Make sure the user running the cron has read/write access to the project directory

### Finding the correct npm path

```bash
which npm
```

This will output something like `/usr/local/bin/npm` or `/usr/bin/npm` - use this exact path in your crontab.

## Using systemd (Linux Alternative)

If you prefer systemd over cron, you can create a systemd service and timer.

### 1. Create the service file

Create `/etc/systemd/system/withings-fetch.service`:

```ini
[Unit]
Description=Fetch Withings data for all users
After=network.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/nextjs-withings-monitor
ExecStart=/usr/bin/npm run fetch-all
StandardOutput=journal
StandardError=journal
```

### 2. Create the timer file

Create `/etc/systemd/system/withings-fetch.timer`:

```ini
[Unit]
Description=Run Withings data fetch daily
Requires=withings-fetch.service

[Timer]
OnCalendar=daily
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

### 3. Enable and start the timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable withings-fetch.timer
sudo systemctl start withings-fetch.timer
```

### 4. Check timer status

```bash
sudo systemctl status withings-fetch.timer
sudo systemctl list-timers withings-fetch.timer
```

### 5. View logs

```bash
journalctl -u withings-fetch.service
```

## Monitoring

### View the log file (cron method)

```bash
tail -f /tmp/withings-fetch.log
```

### View recent logs

```bash
tail -100 /tmp/withings-fetch.log
```

### Check if the cronjob is running

```bash
ps aux | grep fetch-all-users
```

## Troubleshooting

### Cronjob not running

1. Check if cron service is running:
   ```bash
   # macOS
   sudo launchctl list | grep cron
   
   # Linux
   sudo systemctl status cron
   ```

2. Check the log file for errors:
   ```bash
   cat /tmp/withings-fetch.log
   ```

3. Test the command manually:
   ```bash
   cd /Users/depidsvy/dev/nextjs-withings-monitor && npm run fetch-all
   ```

### Permission issues

Make sure the cron user has permission to:

- Read `.env.json`
- Write to the `data/` directory
- Execute npm and node

### Environment variables

If your script requires environment variables (e.g., `WITHINGS_CLIENT_ID`), you may need to:

1. Load them in your crontab:
   ```
   0 3 * * * cd /path/to/project && source .env && npm run fetch-all >> /tmp/withings-fetch.log 2>&1
   ```

2. Or create a wrapper script that loads the environment

## Performance Considerations

- The script processes users sequentially with a 1-second delay between each user to avoid rate limiting
- For many users, consider increasing the delay or running the script less frequently
- Each run fetches only the current month's data, keeping API usage minimal

## Security

- Ensure `.env.json` has proper file permissions (600 or 640)
- Logs may contain sensitive information - secure the log file appropriately
- Consider rotating logs to prevent them from growing too large
