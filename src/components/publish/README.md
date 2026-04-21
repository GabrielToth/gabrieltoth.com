# Publish Components

This directory contains components for the Publish tab of the dashboard redesign.

## Components

### PublishContainer

Main container component for the Publish tab. Manages state for posts and filters.

#### Features

- **Post Management**: Displays a list of posts with their details (title, content, status, channels)
- **Filtering**: Filter posts by social channel (Facebook, Instagram, Twitter, TikTok, LinkedIn)
- **Post Actions**: Edit and delete buttons for each post
- **Status Display**: Shows post status (Scheduled, Published, Failed)
- **Error Handling**: Displays error messages for failed posts
- **Responsive Design**: Works on desktop and mobile devices

#### Props

```typescript
interface PublishContainerProps {
  children?: React.ReactNode
}
```

- `children` (optional): Custom content to render instead of default layout

#### Usage

```tsx
import { PublishContainer } from "@/components/publish"

export default function PublishPage() {
  return <PublishContainer />
}
```

#### With Custom Children

```tsx
import { PublishContainer } from "@/components/publish"

export default function PublishPage() {
  return (
    <PublishContainer>
      <div>Custom content here</div>
    </PublishContainer>
  )
}
```

## Data Models

### Post

```typescript
interface Post {
  id: string
  title: string
  content: string
  scheduledAt: Date
  publishedAt?: Date
  status: "scheduled" | "published" | "failed"
  channels: string[]
  errorMessage?: string
  createdAt: Date
}
```

### SocialChannel

```typescript
interface SocialChannel {
  id: string
  platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
  accountId: string
  accountName: string
  isConnected: boolean
  connectedAt?: Date
}
```

## Styling

The component uses Tailwind CSS for styling and follows the Vercel color palette:

- Primary Blue: `#0070F3`
- Dark Background: `#000000`
- White: `#FFFFFF`
- Light Gray: `#F5F5F5`

## Accessibility

The component includes:

- Semantic HTML elements
- ARIA labels for buttons
- Keyboard navigation support
- Focus indicators
- Color contrast compliance (WCAG 2.1 AA)

## Testing

Unit tests are provided in `PublishContainer.test.tsx`. Run tests with:

```bash
npm run test
```

## Storybook

View the component in Storybook:

```bash
npm run storybook
```

Then navigate to `Components/Publish/PublishContainer`

## Future Enhancements

- [ ] Connect to API for fetching posts
- [ ] Implement edit post modal
- [ ] Implement delete post confirmation
- [ ] Add pagination for large post lists
- [ ] Add search functionality
- [ ] Add sorting options
- [ ] Add bulk actions
- [ ] Add post scheduling
- [ ] Add post templates
