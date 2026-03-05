/**
 * Test script for Logger with Discord alerts
 * Run: npx tsx scripts/test-logger.ts
 */

// Load env
import "dotenv/config"

// Simulate the logger (can't use path aliases in standalone script)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

async function testDiscordAlert() {
    if (!DISCORD_WEBHOOK_URL) {
        console.error("DISCORD_WEBHOOK_URL not set in .env.local")
        process.exit(1)
    }

    console.log("🧪 Testing Discord webhook...")

    const embed = {
        title: "✅ TEST: Platform Logger",
        description: "If you see this, Discord alerts are working correctly!",
        color: 0x00ff00,
        fields: [
            {
                name: "Environment",
                value: process.env.NODE_ENV || "development",
                inline: true,
            },
            {
                name: "Timestamp",
                value: new Date().toISOString(),
                inline: true,
            },
        ],
        timestamp: new Date().toISOString(),
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] }),
        })

        if (response.ok) {
            console.log("✅ Discord alert sent successfully!")
        } else {
            console.error("❌ Discord returned status:", response.status)
        }
    } catch (err) {
        console.error("❌ Failed to send Discord alert:", err)
    }
}

testDiscordAlert()
