"use client"

import { Button, ButtonProps } from "@/components/ui/button"

interface WhatsAppButtonProps extends Omit<ButtonProps, "onClick"> {
    text: string
    phoneNumber: string
    children: React.ReactNode
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg"
    className?: string
}

const WhatsAppButton = ({
    text,
    phoneNumber,
    children,
    variant = "default",
    size = "default",
    className,
    ...props
}: WhatsAppButtonProps) => {
    const handleClick = () => {
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`
        window.open(whatsappLink, "_blank")
    }

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            size={size}
            className={className}
            {...props}
        >
            {children}
        </Button>
    )
}

export default WhatsAppButton
