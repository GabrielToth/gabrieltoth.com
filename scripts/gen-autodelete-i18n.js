const fs = require("fs")
const add = {
    en: {
        accountAutoDelete: "Account auto-delete",
        accountAutoDeleteDescription:
            "Automatically delete your account after a period of inactivity.",
        accountAutoDeleteTitle: "Enable auto-delete",
        accountAutoDeleteHint:
            "If enabled, your account will be permanently deleted after the chosen period without access. Default is indefinite (never deleted).",
        accountAutoDeletePeriod: "Delete after",
        period7d: "7 days",
        period30d: "30 days",
        period90d: "3 months",
        period1y: "1 year",
    },
    "pt-BR": {
        accountAutoDelete: "Autodeleção de conta",
        accountAutoDeleteDescription:
            "Exclua automaticamente sua conta após um período de inatividade.",
        accountAutoDeleteTitle: "Ativar autodeleção",
        accountAutoDeleteHint:
            "Se ativado, sua conta será excluída permanentemente após o período escolhido sem acesso. Padrão: por tempo indeterminado (nunca excluída).",
        accountAutoDeletePeriod: "Excluir após",
        period7d: "7 dias",
        period30d: "30 dias",
        period90d: "3 meses",
        period1y: "1 ano",
    },
    es: {
        accountAutoDelete: "Autoeliminación de cuenta",
        accountAutoDeleteDescription:
            "Elimina automáticamente tu cuenta tras un período de inactividad.",
        accountAutoDeleteTitle: "Habilitar autoeliminación",
        accountAutoDeleteHint:
            "Si está habilitado, tu cuenta se eliminará permanentemente tras el período elegido sin acceso. Por defecto: indefinido (nunca se elimina).",
        accountAutoDeletePeriod: "Eliminar después de",
        period7d: "7 días",
        period30d: "30 días",
        period90d: "3 meses",
        period1y: "1 año",
    },
    de: {
        accountAutoDelete: "Automatische Kontolöschung",
        accountAutoDeleteDescription:
            "Löscht dein Konto automatisch nach einer Inaktivitätsphase.",
        accountAutoDeleteTitle: "Automatische Löschung aktivieren",
        accountAutoDeleteHint:
            "Wenn aktiviert, wird dein Konto nach dem gewählten Zeitraum ohne Zugriff dauerhaft gelöscht. Standard: unbestimmt (nie gelöscht).",
        accountAutoDeletePeriod: "Löschen nach",
        period7d: "7 Tage",
        period30d: "30 Tage",
        period90d: "3 Monate",
        period1y: "1 Jahr",
    },
    fr: {
        accountAutoDelete: "Suppression automatique du compte",
        accountAutoDeleteDescription:
            "Supprime automatiquement votre compte après une période d'inactivité.",
        accountAutoDeleteTitle: "Activer la suppression automatique",
        accountAutoDeleteHint:
            "Si activé, votre compte sera supprimé définitivement après la période choisie sans accès. Par défaut : indéfini (jamais supprimé).",
        accountAutoDeletePeriod: "Supprimer après",
        period7d: "7 jours",
        period30d: "30 jours",
        period90d: "3 mois",
        period1y: "1 an",
    },
}
for (const loc of Object.keys(add)) {
    const f = "src/i18n/" + loc + "/dashboard.json"
    const d = JSON.parse(fs.readFileSync(f, "utf8"))
    Object.assign(d.settings, add[loc])
    fs.writeFileSync(f, JSON.stringify(d, null, 4) + "\n")
    console.log("settings keys added to", loc)
}
