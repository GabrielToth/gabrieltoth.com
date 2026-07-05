import * as LucideIcons from "lucide-react"
import { LucideIcon } from "lucide-react"
import { IconType } from "react-icons"
import {
    FaFacebook,
    FaFilm,
    FaImage,
    FaInstagram,
    FaLinkedin,
    FaTiktok,
    FaTwitter,
    FaTwitch,
    FaYoutube,
} from "react-icons/fa"
import { SiKick } from "react-icons/si"
import { MdLiveTv, MdVideocam } from "react-icons/md"

export type IconName =
    | keyof typeof LucideIcons
    | "SiAdobepremierepro"
    | "SiAdobeaftereffects"
    | "SiAdobephotoshop"
    | "Youtube"
    | "Facebook"
    | "Instagram"
    | "Twitter"
    | "TikTok"
    | "Linkedin"
    | "Kick"
    | "Twitch"
    | "Trovo"
    | "Kwai"

export const getIconByName = (name: IconName): LucideIcon | IconType => {
    // Handle special cases first
    if (name === "SiAdobepremierepro") return FaFilm // Video editing icon
    if (name === "SiAdobeaftereffects") return FaFilm // Video effects icon
    if (name === "SiAdobephotoshop") return FaImage // Image editing icon
    if (name === "Youtube") return FaYoutube
    if (name === "Facebook") return FaFacebook
    if (name === "Instagram") return FaInstagram
    if (name === "Twitter") return FaTwitter
    if (name === "TikTok") return FaTiktok
    if (name === "Linkedin") return FaLinkedin
    if (name === "Kick") return SiKick
    if (name === "Twitch") return FaTwitch
    if (name === "Trovo") return MdLiveTv
    if (name === "Kwai") return MdVideocam

    // Handle Lucide icons
    return LucideIcons[name as keyof typeof LucideIcons] as LucideIcon
}
