# UI Components Library

This directory contains reusable UI components for the dashboard redesign. All components are built with TypeScript, Tailwind CSS, and Radix UI primitives for accessibility and customization.

## Components

### Card
A flexible container component for displaying content blocks with consistent styling.

**Features:**
- White background with light gray border
- Rounded corners
- Shadow effect
- Composable sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        Card content goes here
      </CardContent>
    </Card>
  )
}
```

### Button
A versatile button component with multiple variants and sizes.

**Variants:**
- `default` - Primary blue background
- `secondary` - Light gray background
- `outline` - Bordered style
- `ghost` - Minimal style

**Sizes:**
- `sm` - Small button
- `default` - Medium button (default)
- `lg` - Large button

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

export function MyButtons() {
  return (
    <>
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button size="lg">Large Button</Button>
    </>
  )
}
```

### Input
A text input field with label, error message, and placeholder support.

**Features:**
- Accessible label association
- Error state styling
- Placeholder text
- Focus indicators
- Disabled state

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

export function MyInput() {
  const [value, setValue] = useState("")
  
  return (
    <Input
      type="email"
      placeholder="Enter your email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Select
A dropdown select component with support for groups and custom styling.

**Features:**
- Accessible dropdown with keyboard navigation
- Support for option groups
- Customizable trigger and content
- Scroll buttons for long lists
- Separator support

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"

export function MySelect() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

### Toggle
An on/off switch component for boolean states.

**Features:**
- Multiple size variants (sm, default, lg)
- Pressed state management
- Disabled state
- Icon support
- Accessible ARIA attributes

**Usage:**
```tsx
import { Toggle } from "@/components/ui/toggle"
import { Bold } from "lucide-react"

export function MyToggle() {
  return (
    <Toggle aria-label="Toggle bold">
      <Bold className="h-4 w-4" />
    </Toggle>
  )
}
```

### Modal
A dialog component for displaying modal content with backdrop and close button.

**Features:**
- Backdrop overlay
- Centered content
- Close button
- Composable sub-components: ModalHeader, ModalTitle, ModalDescription, ModalFooter
- Keyboard support (ESC to close)
- Focus management

**Usage:**
```tsx
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

export function MyModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle>Modal Title</ModalTitle>
        </ModalHeader>
        <div className="py-4">Modal content</div>
        <ModalFooter>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

### Icon
An SVG icon wrapper component with size and color customization.

**Features:**
- Support for Lucide React and React Icons
- Customizable size
- Color customization
- Flexible styling with className

**Usage:**
```tsx
import { Icon } from "@/components/ui/icon"
import { Heart } from "lucide-react"

export function MyIcon() {
  return (
    <Icon icon={Heart} size={24} className="text-red-500" />
  )
}
```

### Tabs
A tab navigation component for organizing content into sections.

**Features:**
- Keyboard navigation
- Accessible ARIA attributes
- Customizable styling
- Composable sub-components: Tabs, TabsList, TabsTrigger, TabsContent

**Usage:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function MyTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  )
}
```

### Dialog
A low-level dialog component (used by Modal). Provides full control over dialog behavior.

**Features:**
- Portal rendering
- Overlay backdrop
- Close button
- Composable sub-components
- Full keyboard support

**Usage:**
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        Content
        <DialogFooter>
          <button>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Color Palette

The components use the Vercel color palette:

- **Primary Blue**: `#0070F3` - Used for primary actions and interactive elements
- **Black**: `#000000` - Used for text and dark backgrounds
- **White**: `#FFFFFF` - Used for light backgrounds and cards
- **Light Gray**: `#F5F5F5` - Used for secondary backgrounds and borders
- **Dark Gray**: `#1A1A1A` - Used for dark mode backgrounds
- **Border Gray**: `#EBEBEB` - Used for borders
- **Success Green**: `#0FD66F` - Used for success states
- **Error Red**: `#FF4757` - Used for error states
- **Warning Orange**: `#FFA502` - Used for warning states

## Accessibility

All components follow WCAG 2.1 AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Visible focus rings on all focusable elements
- **Semantic HTML**: Proper use of semantic elements
- **ARIA Labels**: Icon-only buttons have aria-label attributes
- **Alt Text**: All images have descriptive alt text
- **Form Labels**: All inputs have associated labels
- **Screen Reader Support**: Proper heading hierarchy and landmark regions

## Customization

All components accept a `className` prop for Tailwind CSS customization:

```tsx
<Button className="w-full rounded-full">Custom Button</Button>
<Card className="border-2 border-blue-500">Custom Card</Card>
```

## Testing

Each component includes unit tests and Storybook stories for documentation and testing.

**Run tests:**
```bash
npm run test
```

**View Storybook:**
```bash
npm run storybook
```

## Dependencies

- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Icons**: Additional icon library
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility
- **tailwind-merge**: Tailwind CSS class merging

## Best Practices

1. **Use TypeScript**: Always provide proper types for component props
2. **Accessibility First**: Ensure all components are keyboard accessible
3. **Responsive Design**: Test components on mobile, tablet, and desktop
4. **Consistent Styling**: Use the Vercel color palette and Tailwind CSS utilities
5. **Documentation**: Add JSDoc comments and Storybook stories for new components
6. **Testing**: Write unit tests for component logic and accessibility
7. **Performance**: Use React.memo for expensive components
8. **Composition**: Build complex UIs by composing simple components

## Adding New Components

When adding a new component:

1. Create the component file in this directory
2. Add TypeScript types for all props
3. Use Tailwind CSS for styling
4. Add JSDoc comments
5. Create a `.stories.tsx` file for Storybook
6. Create a `.test.tsx` file with unit tests
7. Update this README with usage examples
8. Ensure WCAG 2.1 AA compliance

## Resources

- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide React Icons](https://lucide.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Storybook Documentation](https://storybook.js.org/)
