"use client"

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Share2 } from "lucide-react"
import { useTranslations } from "next-intl"

export interface UniversalPostingButtonProps {
    linkedNetworksCount?: number
    isDisabled?: boolean
    onOpen?: () => void
}

export default function UniversalPostingButton({
    linkedNetworksCount = 0,
    isDisabled = false,
    onOpen,
}: UniversalPostingButtonProps) {
    const t = useTranslations("dashboard.publish")

    const handleClick = () => {
        onOpen?.()
    }

    const tooltipText = isDisabled
        ? t("linkNetworksFirst")
        : t("postToNetworks", { count: linkedNetworksCount })

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={handleClick}
                        disabled={isDisabled}
                        className="relative gap-2"
                        aria-label={t("networksLinked", {
                            count: linkedNetworksCount,
                        })}
                        aria-disabled={isDisabled}
                    >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("post")}</span>
                        {linkedNetworksCount > 0 && (
                            <span
                                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white"
                                aria-label={t("networksLinked", {
                                    count: linkedNetworksCount,
                                })}
                            >
                                {linkedNetworksCount}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
