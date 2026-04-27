# Universal Posting Scheduler - User Guide

## Getting Started

The Universal Posting Scheduler allows you to create, schedule, and publish content across multiple social media networks from a single interface.

## Table of Contents

1. [Linking Social Networks](#linking-social-networks)
2. [Creating Network Groups](#creating-network-groups)
3. [Creating and Scheduling Posts](#creating-and-scheduling-posts)
4. [Viewing Publication History](#viewing-publication-history)
5. [Configuring Preferences](#configuring-preferences)
6. [Troubleshooting](#troubleshooting)

## Linking Social Networks

### Step 1: Access Network Settings

1. Navigate to **Settings** > **Networks**
2. Click **Link New Network**

### Step 2: Choose Platform

Select the social media platform you want to link:
- YouTube
- Facebook
- Instagram
- Twitter
- LinkedIn

### Step 3: Authorize Access

1. Click **Connect** next to your chosen platform
2. You'll be redirected to the platform's authorization page
3. Review the permissions requested
4. Click **Authorize** or **Allow**
5. You'll be redirected back to the application

### Step 4: Verify Connection

Once connected, you'll see:
- ✅ Green "Connected" badge
- Platform icon
- Account information (username, profile picture)

### Disconnecting a Network

To disconnect a network:
1. Go to **Settings** > **Networks**
2. Find the network you want to disconnect
3. Click the **Disconnect** button
4. Confirm the action

**Note:** Disconnecting will revoke the application's access to your account.

## Creating Network Groups

Network groups help you organize your social networks for quick selection when posting.

### Creating a Group

1. Navigate to **Settings** > **Network Groups**
2. Click **New Group**
3. Enter a group name (e.g., "Social Media", "Professional")
4. Select the networks to include in the group
5. Click **Create**

### Editing a Group

1. Find the group you want to edit
2. Click the **Edit** icon (pencil)
3. Update the name or network selection
4. Click **Update**

### Deleting a Group

1. Find the group you want to delete
2. Click the **Delete** icon (trash)
3. Confirm the deletion

**Note:** Deleting a group doesn't disconnect the networks, it only removes the grouping.

## Creating and Scheduling Posts

### Step 1: Open Posting Interface

Click the **Post** button in the main navigation. This button shows:
- Number of linked networks (badge)
- Disabled state if no networks are linked

### Step 2: Select Networks

In the **Network Selector** section:

1. **Individual Selection:**
   - Check/uncheck individual networks
   - See network status (Connected, Expired, Disconnected)

2. **Group Selection:**
   - Check a group to select all networks in that group
   - Indeterminate state shows partial selection

3. **Quick Actions:**
   - **Select All:** Select all connected networks
   - **Deselect All:** Clear all selections

4. **Search:**
   - Use the search box to filter networks by name

### Step 3: Create Content

In the **Content Creator** section:

1. **Text Content:**
   - Type your post content
   - Use formatting buttons (Bold, Italic, Underline, Link)
   - Character count shows remaining characters
   - Warning appears if content exceeds platform limits

2. **Images:**
   - Click **Choose Files** to upload images
   - Supported formats: JPG, PNG, GIF
   - Preview thumbnails appear below
   - Click **X** on thumbnail to remove

3. **URLs:**
   - Enter URL in the input field
   - Click **Add** or press Enter
   - URLs appear as badges below
   - Click **X** on badge to remove

4. **Draft:**
   - Check **Save as Draft** to save without publishing
   - Drafts can be edited later

### Step 4: Schedule Publication

In the **Posting Scheduler** section:

1. **Immediate Publication:**
   - Select **Publish Now** to post immediately

2. **Scheduled Publication:**
   - Select **Schedule for Later**
   - Choose date (up to 365 days in advance)
   - Choose time
   - Select timezone
   - Preview shows scheduled time in human-readable format

3. **Recurring Publication:**
   - Select **Recurring Schedule**
   - Choose date and time for first publication
   - Select recurrence: Daily, Weekly, or Monthly

### Step 5: Publish or Schedule

1. Review your selections:
   - Networks selected
   - Content preview
   - Schedule time

2. Click **Publish Now** or **Schedule Post**

3. Confirmation message appears:
   - ✅ "Posted successfully!" (immediate)
   - ✅ "Post scheduled successfully!" (scheduled)

### Platform-Specific Features

#### YouTube
- Add video title, description, tags
- Set visibility (Public, Unlisted, Private)
- Schedule premiere
- Set thumbnail

#### Facebook
- Tag people and pages
- Set audience (Public, Friends, Custom)
- Add location

#### Instagram
- Add location
- Tag people
- Add alt text for accessibility

#### Twitter
- Add polls
- Tag people
- Add location

#### LinkedIn
- Share as individual or company page
- Add hashtags
- Tag connections

## Viewing Publication History

### Accessing History

Navigate to **Dashboard** > **Publication History**

### Filtering and Sorting

1. **Search:**
   - Search by content text
   - Results update as you type

2. **Filter by Network:**
   - Select network from dropdown
   - Shows only posts published to that network

3. **Filter by Status:**
   - **Success:** Published successfully
   - **Failed:** Publication failed
   - **Pending:** Waiting to be published

4. **Sort:**
   - By date (newest first)
   - By network
   - By status

### Viewing Details

Click on any publication to see:
- Full content
- Publication date and time
- Networks published to
- Status for each network
- Links to published content
- Error messages (if failed)

### Retrying Failed Publications

If a publication failed:
1. Click on the failed publication
2. Review the error message
3. Click **Retry Failed**
4. System will attempt to republish to failed networks

## Configuring Preferences

### Accessing Preferences

Navigate to **Settings** > **Preferences**

### General Settings

1. **Default Timezone:**
   - Select your timezone
   - Used for scheduling posts

2. **Retry Attempts:**
   - Number of times to retry failed publications
   - Range: 1-10 attempts

3. **Notifications:**
   - Enable/disable notifications
   - Receive alerts for:
     - Successful publications
     - Failed publications
     - Network authentication expiring

### Privacy Settings

Set default visibility for each network:
- **Public:** Visible to everyone
- **Friends Only:** Visible to friends/connections
- **Private:** Visible only to you

### Import/Export

1. **Export Preferences:**
   - Click **Export**
   - Downloads JSON file with all preferences
   - Use for backup or transfer to another account

2. **Import Preferences:**
   - Click **Import**
   - Select previously exported JSON file
   - Preferences are restored

## Troubleshooting

### Network Authentication Expired

**Problem:** Network shows "Expired" status

**Solution:**
1. Go to **Settings** > **Networks**
2. Find the expired network
3. Click **Reconnect**
4. Complete authorization flow again

### Post Failed to Publish

**Problem:** Publication shows "Failed" status

**Possible Causes:**
- Network authentication expired
- Content violates platform policies
- Network service temporarily unavailable
- Rate limit exceeded

**Solutions:**
1. Check network authentication status
2. Review content for policy violations
3. Wait a few minutes and retry
4. Contact support if issue persists

### Content Exceeds Character Limit

**Problem:** Warning shows content is too long

**Solutions:**
1. Shorten the text content
2. Remove some URLs or hashtags
3. Deselect networks with lower limits
4. Create platform-specific variations

### Images Not Uploading

**Problem:** Images fail to upload

**Possible Causes:**
- File size too large
- Unsupported format
- Network connection issue

**Solutions:**
1. Compress images before uploading
2. Convert to supported format (JPG, PNG)
3. Check internet connection
4. Try uploading one image at a time

### Scheduled Post Not Publishing

**Problem:** Post didn't publish at scheduled time

**Possible Causes:**
- Network authentication expired before scheduled time
- System maintenance
- Network service unavailable

**Solutions:**
1. Check publication history for error details
2. Verify network authentication status
3. Reschedule the post
4. Contact support if issue persists

## Best Practices

### Content Creation

1. **Keep it concise:** Shorter posts perform better
2. **Use images:** Posts with images get more engagement
3. **Add hashtags:** Increase discoverability
4. **Include calls-to-action:** Encourage engagement
5. **Proofread:** Check for typos before publishing

### Scheduling

1. **Post at optimal times:** When your audience is most active
2. **Spread out posts:** Don't post too frequently
3. **Use recurring schedules:** For regular content
4. **Plan ahead:** Schedule posts in advance
5. **Monitor performance:** Adjust timing based on results

### Network Management

1. **Keep networks connected:** Check status regularly
2. **Organize with groups:** For easier selection
3. **Review permissions:** Ensure necessary access
4. **Update credentials:** When changing passwords
5. **Remove unused networks:** Keep list clean

## Support

Need help? Contact us:
- Email: support@gabrieltoth.com
- Documentation: https://docs.gabrieltoth.com
- Community Forum: https://community.gabrieltoth.com

## Keyboard Shortcuts

- `Ctrl/Cmd + P` - Open posting interface
- `Ctrl/Cmd + S` - Save draft
- `Ctrl/Cmd + Enter` - Publish/Schedule
- `Esc` - Close posting interface
- `Tab` - Navigate between fields
- `Shift + Tab` - Navigate backwards

## Tips and Tricks

1. **Use templates:** Save frequently used content as drafts
2. **Batch scheduling:** Schedule multiple posts at once
3. **Cross-posting:** Adapt content for each platform
4. **Monitor analytics:** Track performance across networks
5. **Engage with audience:** Respond to comments and messages
