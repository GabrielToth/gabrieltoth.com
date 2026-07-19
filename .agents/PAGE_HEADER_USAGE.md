# PageHeader Component Usage Guide

## Overview

The `PageHeader` component provides a standardized, reusable header for all non-dashboard pages. It creates a professional, consistent visual appearance with:

- **Eyebrow text** (small, uppercase, colored badge)
- **Fixed-size title** (responsive: 4xl to 6xl depending on viewport)
- **Optional subtitle** (supporting descriptive text)
- **Children slot** (for CTA buttons or additional content)

## Component Location

```
src/components/layout/page-header.tsx
```

## Basic Usage

```tsx
import PageHeader from "@/components/layout/page-header"
import { useTranslations } from "next-intl"

export default function MyPage() {
    const t = useTranslations("myPage")

    return (
        <>
            <PageHeader
                eyebrow={t("hero.badge")}
                title={t("hero.title")}
                subtitle={t("hero.subtitle")}
            />
            {/* Rest of page content */}
        </>
    )
}
```

## Usage with CTA Buttons

```tsx
<PageHeader
    eyebrow={t("hero.badge")}
    title={t("hero.title")}
    subtitle={t("hero.subtitle")}
>
    <div className="mt-8">
        <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors text-lg"
        >
            <MessageCircle className="mr-2" size={20} />
            {t("hero.cta")}
        </a>
    </div>
</PageHeader>
```

## Component Props

```typescript
interface PageHeaderProps {
    eyebrow: string | ReactNode          // Small badge text (required)
    title: string | ReactNode            // Main heading (required)
    subtitle?: string | ReactNode        // Optional supporting text
    className?: string                   // Additional section classes
    containerClassName?: string          // Additional container classes
    children?: ReactNode                 // CTA buttons or extra content
}
```

## Features

### Eyebrow Text
- Displayed in a rounded badge
- Primary color (blue by default)
- Small font size with semi-bold weight
- Uppercase styling
- Background with 10% opacity of primary color

### Title
- Responsive sizing:
  - Mobile: `text-4xl` (36px)
  - Tablet: `text-5xl` (48px)
  - Desktop: `text-6xl` (60px)
- Bold font weight (900)
- Always centered
- Max width of 5xl for line length control
- Dark mode support

### Subtitle
- Optional additional text
- Slightly muted color
- Larger than body text but smaller than title
- Max width for readability
- Good for supporting description

### Styling

The component includes:
- Consistent padding (py-16 md:py-24)
- Background: muted color with gradient support
- Dark mode support
- Centered text alignment
- Responsive spacing

## Styling Classes

```
Section wrapper:
- w-full py-16 md:py-24
- bg-muted dark:from-blue-900/20 dark:to-primary/10

Container:
- max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- text-center

Eyebrow badge:
- bg-primary/10 dark:bg-primary/10
- text-primary dark:text-primary
- text-sm font-semibold px-4 py-2 rounded-full

Title:
- text-4xl sm:text-5xl lg:text-6xl
- font-bold text-foreground dark:text-foreground
- leading-tight max-w-5xl

Subtitle:
- text-xl text-muted-foreground dark:text-foreground
- max-w-3xl leading-relaxed
```

## Integration Checklist

When adding PageHeader to a page:

- [ ] Import the component: `import PageHeader from "@/components/layout/page-header"`
- [ ] Prepare translation keys: `hero.badge`, `hero.title`, `hero.subtitle`
- [ ] Remove old hero section markup
- [ ] Add PageHeader component as first content element
- [ ] Place CTA buttons in children slot if needed
- [ ] Keep any stats or additional content below PageHeader
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify dark mode appearance
- [ ] Test with all 4 locales (en, pt-BR, es, de)

## Pages to Update

Priority order for applying PageHeader:

1. ✅ **Channel Management** - Already done
2. **Amazon Affiliate** - Simple layout
3. **Editors** - Simple layout
4. **About Me** - Simple layout
5. **Privacy Policy** - Content-heavy
6. **Terms of Service** - Content-heavy
7. **Services Landing** - Multiple sections
8. **Personality Test** - Custom flow
9. **PC Optimization** - Custom dark theme (needs special handling)

## Example: Before and After

### Before (Old Approach)

```tsx
<section className="relative py-20 bg-muted">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block mb-6">
            <span className="bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
                {t("hero.badge")}
            </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            {t("hero.title")}
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            {t("hero.subtitle")}
        </p>
        {/* CTA Buttons */}
    </div>
</section>
```

### After (New Approach)

```tsx
<PageHeader
    eyebrow={t("hero.badge")}
    title={t("hero.title")}
    subtitle={t("hero.subtitle")}
>
    {/* CTA Buttons */}
</PageHeader>
```

## Dark Mode

The component automatically supports dark mode:

```
- eyebrow: stays primary color (matches both light and dark)
- title: uses foreground color (adapts to theme)
- background: transitions to gradient with blue/primary tones
- subtitle: uses muted-foreground with dark mode adjustment
```

No additional dark mode CSS needed - Tailwind dark: variants handle it.

## Customization

For pages needing custom styling:

```tsx
<PageHeader
    eyebrow={t("hero.badge")}
    title={t("hero.title")}
    subtitle={t("hero.subtitle")}
    className="bg-gradient-to-r from-blue-900 to-purple-900"  // Custom section bg
    containerClassName="py-32"  // Custom padding
>
    {/* Content */}
</PageHeader>
```

## SEO Consideration

The `eyebrow` text should be:
- Service name or category (e.g., "Channel Management Service")
- Kept concise (2-4 words)
- Same across all locales but translated appropriately

The `title` should be:
- Your main keyword or service proposition
- Compelling and clear
- 8-12 words typically

## Translation Keys Required

For each page using PageHeader, add these translation keys:

```json
{
    "hero": {
        "badge": "Main Category Or Service",
        "title": "Your Main Heading",
        "subtitle": "Supporting descriptive text (optional)"
    }
}
```

## Responsive Behavior

- **Mobile (< 640px)**: 
  - Title: 4xl (36px)
  - Single column layout
  - Reduced padding

- **Tablet (640px - 1024px)**:
  - Title: 5xl (48px)
  - Medium padding

- **Desktop (> 1024px)**:
  - Title: 6xl (60px)
  - Full width with max-width constraint

## Next Steps

1. Add PageHeader to remaining pages per priority list
2. Update i18n translations for each page
3. Test responsive design
4. Verify dark mode
5. Test all 4 locales
6. Build and deploy

---

Last Updated: 2026-07-19
Component Version: 1.0.0
