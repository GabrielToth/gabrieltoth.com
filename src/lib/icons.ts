import * as LucideIcons from "lucide-react"
import { LucideIcon } from "lucide-react"
import { IconType } from "react-icons"
import { FaFilm, FaImage, FaYoutube } from "react-icons/fa"

export type IconName =
    | keyof typeof LucideIcons
    | "SiAdobepremierepro"
    | "SiAdobeaftereffects"
    | "SiAdobephotoshop"
    | "Youtube"

export const getIconByName = (name: IconName): LucideIcon | IconType => {
    // Handle special cases first
    if (name === "SiAdobepremierepro") return FaFilm // Video editing icon
    if (name === "SiAdobeaftereffects") return FaFilm // Video effects icon
    if (name === "SiAdobephotoshop") return FaImage // Image editing icon
    if (name === "Youtube") return FaYoutube

    // Handle Lucide icons
    return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon
}
