"use client"

import React from "react"
import { useChatSettings } from "@/hooks/use-chat-settings"

export const ChatSettingsSection: React.FC = () => {
    const { settings, updateSettings } = useChatSettings()

    return (
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div>
                <h3 className="text-lg font-semibold text-foreground">
                    Live Chat & Unified Stream Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                    Configure chat message timestamps, universal creator display names, badges, and font sizes across Twitch, Kick, and YouTube.
                </p>
            </div>

            <div className="space-y-4 divide-y divide-border">
                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            Show Message Timestamps
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Display the message sent time (e.g. 12:34 PM) next to messages in the unified chat stream.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showTimestamps}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateSettings({ showTimestamps: e.target.checked })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            Unify Creator Display Name Across Platforms
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Display your account's universal nickname for your own messages across Twitch, Kick, and YouTube instead of raw platform handles.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.useUniversalNickname}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateSettings({ useUniversalNickname: e.target.checked })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            Show Platform Badges
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Display moderator, subscriber, and VIP badges next to chat usernames.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showBadges}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateSettings({ showBadges: e.target.checked })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            Chat Stream Font Size
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Adjust font size for chat messages in dashboard and popouts.
                        </p>
                    </div>
                    <select
                        value={settings.fontSize}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateSettings({ fontSize: e.target.value as any })
                        }
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="xs">Small (11px)</option>
                        <option value="sm">Medium (12px)</option>
                        <option value="md">Large (14px)</option>
                        <option value="lg">Extra Large (16px)</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
