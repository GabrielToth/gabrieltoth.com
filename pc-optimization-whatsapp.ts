export const generatePCOptimizationWhatsAppMessage = (locale: string) => {
    const baseMessage =
        locale === "pt-BR"
            ? "Olá! Tenho interesse na otimização de PC Gaming.%0A%0A" +
              "📋 INFORMAÇÕES DO MEU SETUP:%0A%0A" +
              "💻 Processador (CPU):%0A" +
              "🎮 Placa de Vídeo (GPU):%0A" +
              "🧠 Memória RAM:%0A" +
              "💾 Armazenamento (SSD/HD):%0A" +
              "🔌 Fonte:%0A" +
              "🏠 Placa-mãe:%0A" +
              "🖥️ Monitor:%0A" +
              "⌨️ Periféricos:%0A%0A" +
              "🎯 PRINCIPAIS JOGOS QUE JOGO:%0A%0A" +
              "⚡ PROBLEMAS ATUAIS:%0A" +
              "□ Baixo FPS%0A" +
              "□ Input lag%0A" +
              "□ Stuttering%0A" +
              "□ Lag de rede%0A" +
              "□ Outros:%0A%0A" +
              "💰 ORÇAMENTO APROXIMADO:%0A" +
              "□ R$ 149 - Boost Básico%0A" +
              "□ R$ 249 - Otimização Pro%0A" +
              "□ R$ 449 - Overhaul Supremo%0A%0A" +
              "Aguardo o contato!"
            : locale === "es"
              ? "¡Hola! Estoy interesado en la optimización de PC Gaming.%0A%0A" +
                "📋 INFORMACIÓN DE MI SETUP:%0A%0A" +
                "💻 Procesador (CPU):%0A" +
                "🎮 Tarjeta Gráfica (GPU):%0A" +
                "🧠 Memoria RAM:%0A" +
                "💾 Almacenamiento (SSD/HD):%0A" +
                "🔌 Fuente de Poder:%0A" +
                "🏠 Placa Madre:%0A" +
                "🖥️ Monitor:%0A" +
                "⌨️ Periféricos:%0A%0A" +
                "🎯 PRINCIPALES JUEGOS QUE JUEGO:%0A%0A" +
                "⚡ PROBLEMAS ACTUALES:%0A" +
                "□ Bajo FPS%0A" +
                "□ Input lag%0A" +
                "□ Stuttering%0A" +
                "□ Lag de red%0A" +
                "□ Otros:%0A%0A" +
                "💰 PRESUPUESTO APROXIMADO:%0A" +
                "□ $149 - Impulso Básico%0A" +
                "□ $249 - Optimización Pro%0A" +
                "□ $449 - Renovación Suprema%0A%0A" +
                "¡Espero el contacto!"
              : locale === "de"
                ? "Hallo! Ich bin an der Gaming PC Optimierung interessiert.%0A%0A" +
                  "📋 INFORMATIONEN ZU MEINEM SETUP:%0A%0A" +
                  "💻 Prozessor (CPU):%0A" +
                  "🎮 Grafikkarte (GPU):%0A" +
                  "🧠 Arbeitsspeicher (RAM):%0A" +
                  "💾 Speicher (SSD/HD):%0A" +
                  "🔌 Netzteil:%0A" +
                  "🏠 Motherboard:%0A" +
                  "🖥️ Monitor:%0A" +
                  "⌨️ Peripherie:%0A%0A" +
                  "🎯 HAUPTSPIELE DIE ICH SPIELE:%0A%0A" +
                  "⚡ AKTUELLE PROBLEME:%0A" +
                  "□ Niedrige FPS%0A" +
                  "□ Input Lag%0A" +
                  "□ Stuttering%0A" +
                  "□ Netzwerk Lag%0A" +
                  "□ Andere:%0A%0A" +
                  "💰 UNGEFÄHRES BUDGET:%0A" +
                  "□ $149 - Basis Boost%0A" +
                  "□ $249 - Pro Optimierung%0A" +
                  "□ $449 - Supreme Überholung%0A%0A" +
                  "Ich freue mich auf den Kontakt!"
                : "Hello! I'm interested in Gaming PC Optimization.%0A%0A" +
                  "📋 MY SETUP INFORMATION:%0A%0A" +
                  "💻 Processor (CPU):%0A" +
                  "🎮 Graphics Card (GPU):%0A" +
                  "🧠 RAM Memory:%0A" +
                  "💾 Storage (SSD/HD):%0A" +
                  "🔌 Power Supply:%0A" +
                  "🏠 Motherboard:%0A" +
                  "🖥️ Monitor:%0A" +
                  "⌨️ Peripherals:%0A%0A" +
                  "🎯 MAIN GAMES I PLAY:%0A%0A" +
                  "⚡ CURRENT ISSUES:%0A" +
                  "□ Low FPS%0A" +
                  "□ Input lag%0A" +
                  "□ Stuttering%0A" +
                  "□ Network lag%0A" +
                  "□ Others:%0A%0A" +
                  "💰 APPROXIMATE BUDGET:%0A" +
                  "□ $149 - Basic Boost%0A" +
                  "□ $249 - Pro Optimization%0A" +
                  "□ $449 - Supreme Overhaul%0A%0A" +
                  "Looking forward to hearing from you!"

    /* c8 ignore next */
    return `https://wa.me/5511993313606?text=${baseMessage}`
}
