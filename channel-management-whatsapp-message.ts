export const generateWhatsAppMessage = (
    planName: string,
    price: number,
    isMonero: boolean,
    locale: string
) => {
    const paymentMethod = isMonero
        ? "Monero (XMR)"
        : locale === "pt-BR"
          ? "PIX/Cartão"
          : "Card"
    const currency = locale === "en" ? "$" : "R$"
    const baseMessage =
        locale === "pt-BR"
            ? "Olá! Tenho interesse na consultoria de canal.%0A%0A" +
              `📋 Plano escolhido: ${planName}%0A` +
              `💰 Valor: ${currency} ${price}%0A` +
              `💳 Forma de pagamento: ${paymentMethod}%0A%0A` +
              "Nome:%0ACanal do YouTube:%0AQual seu principal objetivo:%0ATipo de conteúdo:%0AFrequência de postagem:%0A%0AAguardo o contato!"
            : "Hello! I'm interested in channel consulting.%0A%0A" +
              `📋 Chosen plan: ${planName}%0A` +
              `💰 Price: ${currency} ${price}%0A` +
              `💳 Payment method: ${paymentMethod}%0A%0A` +
              "Name:%0AYouTube Channel:%0AYour main goal:%0AContent type:%0APosting frequency:%0A%0ALooking forward to hearing from you!"

    return `https://wa.me/5511993313606?text=${baseMessage}`
}
