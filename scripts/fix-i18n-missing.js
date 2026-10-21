#!/usr/bin/env node
/**
 * fix-i18n-missing.js — Adds missing i18n keys to all 5 locales.
 * Idempotent: skips keys that already exist (setDeep overwrites though,
 * so presence-check is done via scanner before running).
 *
 * Key facts about file layout:
 *  - "dashboard.settings.tabs.profile" lives in dashboard.json under settings.tabs.profile
 *  - "publish.step6.membersOnly" lives in publish.json under step6.membersOnly
 *  - "layout.header.servicesDropdown.support" lives in layout.header.json
 */
const fs = require("fs")
const path = require("path")

const I18N = path.join(__dirname, "..", "src", "i18n")

const T = {
    activityHeatmap: {
        "pt-BR": "Mapa de Atividade",
        en: "Activity Heatmap",
        es: "Mapa de Actividad",
        de: "Aktivitäts-Heatmap",
        fr: "Carte d'Activité",
    },
    heatmapSubtitle: {
        "pt-BR": "Sua atividade nos últimos {days} dias",
        en: "Your activity over the last {days} days",
        es: "Tu actividad en los últimos {days} días",
        de: "Deine Aktivität der letzten {days} Tage",
        fr: "Votre activité des {days} derniers jours",
    },
    tabsProfile: {
        "pt-BR": "Perfil",
        en: "Profile",
        es: "Perfil",
        de: "Profil",
        fr: "Profil",
    },
    tabsPreferences: {
        "pt-BR": "Preferências",
        en: "Preferences",
        es: "Preferencias",
        de: "Einstellungen",
        fr: "Préférences",
    },
    tabsSecurity: {
        "pt-BR": "Segurança",
        en: "Security",
        es: "Seguridad",
        de: "Sicherheit",
        fr: "Sécurité",
    },
    tabsBilling: {
        "pt-BR": "Faturamento",
        en: "Billing",
        es: "Facturación",
        de: "Abrechnung",
        fr: "Facturation",
    },
    tabsIntegrations: {
        "pt-BR": "Integrações",
        en: "Integrations",
        es: "Integraciones",
        de: "Integrationen",
        fr: "Intégrations",
    },
    integrations: {
        "pt-BR": "Integrações",
        en: "Integrations",
        es: "Integraciones",
        de: "Integrationen",
        fr: "Intégrations",
    },
    planValue: {
        "pt-BR": "Plano: {plan}",
        en: "Plan: {plan}",
        es: "Plan: {plan}",
        de: "Tarif: {plan}",
        fr: "Formule : {plan}",
    },
    membersOnly: {
        "pt-BR": "Restrito a membros",
        en: "Members only",
        es: "Solo para miembros",
        de: "Nur für Mitglieder",
        fr: "Réservé aux membres",
    },
    membersOnlyHint: {
        "pt-BR": "Somente membros do canal poderão visualizar esta publicação",
        en: "Only channel members will be able to view this post",
        es: "Solo los miembros del canal podrán ver esta publicación",
        de: "Nur Kanalmitglieder können diesen Beitrag sehen",
        fr: "Seuls les membres de la chaîne pourront voir cette publication",
    },
    support: {
        "pt-BR": "Suporte",
        en: "Support",
        es: "Soporte",
        de: "Support",
        fr: "Assistance",
    },
}

// {file, path[], key, translations}
const ADDITIONS = [
    {
        file: "dashboard",
        path: ["insights"],
        key: "activityHeatmap",
        T: T.activityHeatmap,
    },
    {
        file: "dashboard",
        path: ["insights"],
        key: "heatmapSubtitle",
        T: T.heatmapSubtitle,
    },
    {
        file: "dashboard",
        path: ["settings", "tabs"],
        key: "profile",
        T: T.tabsProfile,
    },
    {
        file: "dashboard",
        path: ["settings", "tabs"],
        key: "preferences",
        T: T.tabsPreferences,
    },
    {
        file: "dashboard",
        path: ["settings", "tabs"],
        key: "security",
        T: T.tabsSecurity,
    },
    {
        file: "dashboard",
        path: ["settings", "tabs"],
        key: "billing",
        T: T.tabsBilling,
    },
    {
        file: "dashboard",
        path: ["settings", "tabs"],
        key: "integrations",
        T: T.tabsIntegrations,
    },
    {
        file: "dashboard",
        path: ["settings"],
        key: "integrations",
        T: T.integrations,
    },
    { file: "dashboard", path: ["settings"], key: "planValue", T: T.planValue },
    { file: "publish", path: ["step6"], key: "membersOnly", T: T.membersOnly },
    {
        file: "publish",
        path: ["step6"],
        key: "membersOnlyHint",
        T: T.membersOnlyHint,
    },
    {
        file: "layout.header",
        path: ["servicesDropdown"],
        key: "support",
        T: T.support,
    },
]

function setDeep(obj, pathArr, key, value) {
    let o = obj
    for (const p of pathArr) {
        if (typeof o[p] !== "object" || o[p] === null) o[p] = {}
        o = o[p]
    }
    if (o[key] !== undefined) return false
    o[key] = value
    return true
}

for (const locale of ["pt-BR", "en", "es", "de", "fr"]) {
    const byFile = {}
    for (const a of ADDITIONS) {
        const fp = path.join(I18N, locale, a.file + ".json")
        if (!byFile[fp]) byFile[fp] = JSON.parse(fs.readFileSync(fp, "utf8"))
        const added = setDeep(
            byFile[fp],
            a.path,
            a.key,
            a.T[locale] || a.T["en"]
        )
        if (!added)
            console.log(
                `  (skip existing) ${locale}/${a.file} ${[...a.path, a.key].join(".")}`
            )
    }
    for (const [fp, tree] of Object.entries(byFile)) {
        fs.writeFileSync(fp, JSON.stringify(tree, null, 4) + "\n")
        console.log(`updated ${path.relative(I18N, fp)}`)
    }
}
console.log("done")
