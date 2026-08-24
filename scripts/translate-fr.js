const fs = require("fs")
const path = require("path")

const translations = {
    // Auth/Login
    "Sign In": "Se connecter",
    "Sign Up": "S'inscrire",
    "Create Account": "Créer un compte",
    Email: "E-mail",
    Password: "Mot de passe",
    "Confirm Password": "Confirmer le mot de passe",
    "Forgot password": "Mot de passe oublié",
    "Remember me": "Se souvenir de moi",
    Login: "Connexion",
    Register: "Inscription",
    Loading: "Chargement",
    Continue: "Continuer",

    // Dashboard
    Dashboard: "Tableau de bord",
    Publish: "Publier",
    Live: "En direct",
    Insights: "Analyses",
    Channels: "Chaînes",
    Settings: "Paramètres",
    Logout: "Déconnexion",
    Profile: "Profil",

    // Common
    Home: "Accueil",
    About: "À propos",
    Services: "Services",
    Contact: "Contact",
    Back: "Retour",
    Next: "Suivant",
    Previous: "Précédent",
    Submit: "Soumettre",
    Cancel: "Annuler",
    Save: "Enregistrer",
    Delete: "Supprimer",
    Edit: "Modifier",
    Search: "Rechercher",
    Filter: "Filtrer",
    Sort: "Trier",

    // Status
    Success: "Succès",
    Error: "Erreur",
    Warning: "Avertissement",
    Info: "Information",

    // Actions
    "Get Started": "Commencer",
    "Learn More": "En savoir plus",
    View: "Voir",
    Download: "Télécharger",
    Upload: "Téléverser",
    Share: "Partager",
}

function translateJSON(obj) {
    if (typeof obj === "string") {
        let result = obj
        for (const [en, fr] of Object.entries(translations)) {
            const regex = new RegExp(`\\b${en}\\b`, "g")
            result = result.replace(regex, fr)
        }
        return result
    }

    if (Array.isArray(obj)) {
        return obj.map(translateJSON)
    }

    if (typeof obj === "object" && obj !== null) {
        const result = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = translateJSON(value)
        }
        return result
    }

    return obj
}

const frDir = "src/i18n/fr"
const files = [
    "auth.json",
    "home.json",
    "editors.json",
    "channelManagement.json",
    "dashboard.json",
    "landing.json",
]

files.forEach(file => {
    const filePath = path.join(frDir, file)
    if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
        const translated = translateJSON(content)
        fs.writeFileSync(filePath, JSON.stringify(translated, null, 4))
        console.log(`✓ Translated ${file}`)
    }
})

console.log("Done!")
