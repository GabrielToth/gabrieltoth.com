import * as LucideIcons from "lucide-react"
import { LucideIcon } from "lucide-react"
import { IconType } from "react-icons"
import { FaYoutube } from "react-icons/fa"
import {
    SiAdobeaftereffects,
    SiAdobephotoshop,
    SiAdobepremierepro,
} from "react-icons/si"

export type IconName =
    | keyof typeof LucideIcons
    | "SiAdobepremierepro"
    | "SiAdobeaftereffects"
    | "SiAdobephotoshop"
    | "Youtube"

export const getIconByName = (name: IconName): LucideIcon | IconType => {
    // Handle special cases first
    if (name === "SiAdobepremierepro") return SiAdobepremierepro
    if (name === "SiAdobeaftereffects") return SiAdobeaftereffects
    if (name === "SiAdobephotoshop") return SiAdobephotoshop
    if (name === "Youtube") return FaYoutube

    // Handle Lucide icons
    return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon
}
