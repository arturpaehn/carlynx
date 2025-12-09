# SFTP Server Setup Documentation

## Overview
SFTP server for receiving CSV inventory feeds from DealerCenter and automatically processing them into CarLynx database.

---

## Server Details

**Provider:** DigitalOcean  
**Server Name:** carlynx.us-sftp  
**IP Address:** 159.203.103.126  
**OS:** Ubuntu 24.04 LTS  
**Size:** 1 vCPU, 1 GB RAM, 25 GB SSD ($6/month)  
**Location:** New York City (NYC3)

---

## SFTP Credentials

**For DealerCenter:**
```
SFTP Host: 159.203.103.126
SFTP Port: 22
Username: dealercenter
Password: [password set during setup]
Upload Directory: /uploads
Protocol: SFTP (SSH File Transfer Protocol)
```

---

## Architecture

```
DealerCenter 
    ↓ (uploads CSV via SFTP)
/home/dealercenter/uploads/
    ↓ (cron job every 15 min)
Bash Script (process-dealercenter-csv.sh)
    ↓ (HTTP POST)
https://carlynx.us/api/dealercenter/feed/ingest
    ↓ (processes CSV)
Supabase Database
    ↓ (sends emails)
Dealers receive activation links
```

---

## File Structure

```
/home/dealercenter/
├── uploads/                          # SFTP upload directory
│   └── processed/                    # Archived processed files
└── /usr/local/bin/
    └── process-dealercenter-csv.sh   # Processing script
```

---

## Setup Steps Performed

### 1. Created DigitalOcean Droplet
```bash
# Droplet Configuration:
- Image: Ubuntu 24.04 LTS
- Plan: Basic ($6/mo)
- Datacenter: NYC3
- Authentication: Password
```

### 2. System Update
```bash
apt update && apt upgrade -y
```

### 3. Created SFTP User
```bash
adduser dealercenter
# Password set interactively
```

### 4. Created Upload Directories
```bash
mkdir -p /home/dealercenter/uploads
chown dealercenter:dealercenter /home/dealercenter/uploads
```

### 5. Configured SSH/SFTP
```bash
nano /etc/ssh/sshd_config
```

**Added configuration:**
```
Match User dealercenter
    ForceCommand internal-sftp
    PasswordAuthentication yes
    ChrootDirectory /home/dealercenter
    PermitTunnel no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
```

**Restart SSH:**
```bash
systemctl restart ssh
```

### 6. Created Processing Script
```bash
nano /usr/local/bin/process-dealercenter-csv.sh
```

**Script content:**
```bash
#!/bin/bash

# Configuration
UPLOAD_DIR="/home/dealercenter/uploads"
PROCESSED_DIR="/home/dealercenter/uploads/processed"
API_URL="https://carlynx.us/api/dealercenter/feed/ingest"
API_KEY="dc_live_gap457yshfvx8mdbwqkcje0lzi3n21u9"
LOG_FILE="/var/log/dealercenter-import.log"

# Create processed directory if it doesn't exist
mkdir -p "$PROCESSED_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Process each CSV file in upload directory
for file in "$UPLOAD_DIR"/*.csv; do
    # Skip if no CSV files found
    [ -e "$file" ] || continue
    
    filename=$(basename "$file")
    log "Processing file: $filename"
    
    # Send CSV to API
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "x-api-key: $API_KEY" \
        -H "Content-Type: text/csv" \
        --data-binary "@$file")
    
    # Extract HTTP status code
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        log "SUCCESS: $filename - $body"
        # Move to processed folder
        mv "$file" "$PROCESSED_DIR/$filename.$(date +%Y%m%d_%H%M%S)"
    else
        log "ERROR: $filename - HTTP $http_code - $body"
    fi
done

# Clean up processed files older than 30 days
find "$PROCESSED_DIR" -type f -mtime +30 -delete

log "Processing complete"
```

**Make executable:**
```bash
chmod +x /usr/local/bin/process-dealercenter-csv.sh
```

### 7. Setup Cron Job
```bash
crontab -e
```

**Added cron entry:**
```
*/15 * * * * /usr/local/bin/process-dealercenter-csv.sh
```

This runs the script every 15 minutes.

---

## How It Works

1. **DealerCenter uploads CSV** to SFTP server → lands in `/home/dealercenter/uploads/`

2. **Cron job runs every 15 minutes** → executes `process-dealercenter-csv.sh`

3. **Script processes all .csv files:**
   - Reads each CSV file
   - Sends POST request to `https://carlynx.us/api/dealercenter/feed/ingest`
   - Includes API key for authentication
   - Logs success/failure

4. **API endpoint processes CSV:**
   - Parses dealer and vehicle data
   - Creates/updates dealers in Supabase
   - Creates/updates listings in Supabase
   - Sends welcome emails to dealers (if Email field exists)

5. **After successful processing:**
   - File moved to `/home/dealercenter/uploads/processed/`
   - Timestamped for archival
   - Auto-deleted after 30 days

---

## Monitoring & Logs

### Check Processing Logs
```bash
tail -f /var/log/dealercenter-import.log
```

### Check Cron Job Status
```bash
crontab -l
```

### Check for Recent Uploads
```bash
ls -lah /home/dealercenter/uploads/
```

### Check Processed Files
```bash
ls -lah /home/dealercenter/uploads/processed/
```

### Check SSH/SFTP Status
```bash
systemctl status ssh
```

---

## Troubleshooting

### SFTP Connection Issues
```bash
# Check if SSH service is running
systemctl status ssh

# Restart SSH if needed
systemctl restart ssh

# Check SSH logs
tail -f /var/log/auth.log
```

### Script Not Running
```bash
# Verify cron is running
systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Test script manually
/usr/local/bin/process-dealercenter-csv.sh
```

### API Connection Issues
```bash
# Test API endpoint manually
curl -X POST https://carlynx.us/api/dealercenter/feed/ingest \
  -H "x-api-key: dc_live_gap457yshfvx8mdbwqkcje0lzi3n21u9" \
  -H "Content-Type: text/csv" \
  --data-binary "@/path/to/test.csv"
```

### Disk Space Issues
```bash
# Check disk usage
df -h

# Check upload directory size
du -sh /home/dealercenter/uploads/

# Manually clean old files
find /home/dealercenter/uploads/processed -type f -mtime +30 -delete
```

---

## Security Notes

1. **SFTP User Restrictions:**
   - User `dealercenter` is chrooted to `/home/dealercenter`
   - Cannot access other parts of the system
   - SFTP-only access (no SSH shell)

2. **API Authentication:**
   - All API requests require valid API key
   - Key stored in script (server-side only)

3. **File Cleanup:**
   - Processed files auto-deleted after 30 days
   - Prevents disk space issues

4. **Password Security:**
   - SFTP password should be strong
   - Only shared with DealerCenter
   - Change if compromised

---

## Maintenance

### Change SFTP Password
```bash
passwd dealercenter
```

### Update Processing Script
```bash
nano /usr/local/bin/process-dealercenter-csv.sh
# Make changes, save
# No need to restart anything - cron will use updated version
```

### Change Cron Schedule
```bash
crontab -e
# Modify the schedule (e.g., change from */15 to */30 for every 30 min)
```

### Update API Key
```bash
nano /usr/local/bin/process-dealercenter-csv.sh
# Update API_KEY variable
```

---

## Important Notes

⚠️ **Email Requirement:**  
DealerCenter MUST include an `Email` field in the CSV feed for dealers to receive activation links. Without it, dealers will be created but won't get welcome emails.

**Required CSV Format:**
```
AccountID,DCID,DealerName,Email,Phone,Address,City,State,Zip,StockNumber,VIN,Year,Make,Model,Trim,Odometer,SpecialPrice,ExteriorColor,InteriorColor,Transmission,PhotoURLs,VehicleDescription
```

The `Email` field is critical for the activation workflow.

---

## Contact Information

**DigitalOcean Account:** artur.paehn@gmail.com  
**Server Console:** https://cloud.digitalocean.com/droplets/535760015  
**CarLynx Production:** https://carlynx.us  
**API Endpoint:** https://carlynx.us/api/dealercenter/feed/ingest

---

## Setup Date

**Date:** December 9, 2025  
**Set up by:** Artur Pähn
