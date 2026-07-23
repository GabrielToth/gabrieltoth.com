export const generateWhatsAppMessage = (
    planName: string,
    price: number,
    isMonero: boolean,
    paymentMethodCard: string,
    currencySymbol: string,
    template: string
) => {
    const paymentMethod = isMonero
        ? "Monero (XMR)"
        : paymentMethodCard
    const baseMessage = template
        .replace("{planName}", planName)
        .replace("{currency}", currencySymbol)
        .replace("{price}", String(price))
        .replace("{paymentMethod}", paymentMethod)

    return `https://wa.me/5511993313606?text=${baseMessage}`
}
