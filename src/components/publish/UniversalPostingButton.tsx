"use client"

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Share2 } from "lucide-react"
import { useState } from "react"
import PostingInterface from "./PostingInterface"

interface UniversalPostingButtonProps {
    linkedNetworksCount?: number
    isDisabled?: boolean
    onOpen?: () => void
}

export default function UniversalPostingButton({
    linkedNetworksCount = 0,
    isDisabled = false,
    onOpen,
}: UniversalPostingButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleClick = () => {
        setIsOpen(true)
        onOpen?.()
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    const tooltipText = isDisabled
        ? "Link social networks first to start posting"
        : `Post to ${linkedNetworksCount} network${linkedNetworksCount !== 1 ? "s" : ""}`

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={handleClick}
                            disabled={isDisabled}
                            className="relative gap-2"
                            aria-label={`Universal posting button. ${linkedNetworksCount} networks linked.`}
                            aria-disabled={isDisabled}
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Post</span>
                            {linkedNetworksCount > 0 && (
                                <span
                                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white"
                                    aria-label={`${linkedNetworksCount} networks`}
                                >
                                    {linkedNetworksCount}
                                </span>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{tooltipText}</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {isOpen && <PostingInterface onClose={handleClose} />}
        </>
    )
}
