"use client"

import React from "react"
import { useChatSettings } from "@/hooks/use-chat-settings"
import type { ChatSettings } from "@/hooks/use-chat-settings"
import { useTranslations } from "next-intl"

export const ChatSettingsSection: React.FC = () => {
    const t = useTranslations("dashboard.settings.chat")
    const { settings, updateSettings } = useChatSettings()

    return (
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div>
                <h3 className="text-lg font-semibold text-foreground">
                    {t("title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t("description")}
                </p>
            </div>

            <div className="space-y-4 divide-y divide-border">
                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            {t("showTimestamps")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {t("showTimestampsDesc")}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showTimestamps}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                                updateSettings({
                                    showTimestamps: e.target.checked,
                                })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            {t("universalNickname")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {t("universalNicknameDesc")}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.useUniversalNickname}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                                updateSettings({
                                    useUniversalNickname: e.target.checked,
                                })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h4 className="text-sm font-medium text-foreground">
                            {t("showBadges")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {t("showBadgesDesc")}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showBadges}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) =>
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
                            {t("fontSize")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {t("fontSizeDesc")}
                        </p>
                    </div>
                    <select
                        value={settings.fontSize}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateSettings({
                                fontSize: e.target
                                    .value as ChatSettings["fontSize"],
                            })
                        }
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="xs">{t("fontSmall")}</option>
                        <option value="sm">{t("fontMedium")}</option>
                        <option value="md">{t("fontLarge")}</option>
                        <option value="lg">{t("fontExtraLarge")}</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
