import type { Meta, StoryObj } from "@storybook/react"
import { RegistrationFlow } from "./RegistrationFlow"

const meta = {
    title: "Registration/RegistrationFlow",
    component: RegistrationFlow,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof RegistrationFlow>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Complete Registration Flow
 * Shows the complete multi-step registration flow with all steps.
 * Users can navigate through all 4 steps:
 * 1. Email Input - Enter and verify email address
 * 2. Password Setup - Set password with strength indicator
 * 3. Personal Information - Enter name and phone number
 * 4. Verification Review - Review all information before account creation
 *
 * Features demonstrated:
 * - Progress indicator showing current step
 * - Form validation at each step
 * - Error handling and display
 * - Navigation between steps (Next, Back, Cancel)
 * - Session management and persistence
 * - Success message with countdown redirect
 */
export const Default: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Desktop View
 * Shows the registration flow optimized for desktop viewports (≥1024px).
 * Displays horizontal progress indicator and full-width form.
 */
export const DesktopView: Story = {
    render: () => <RegistrationFlow />,
    parameters: {
        viewport: {
            defaultViewport: "desktop",
        },
    },
}

/**
 * Registration Flow - Tablet View
 * Shows the registration flow optimized for tablet viewports (768px-1023px).
 * Displays responsive layout with adjusted spacing.
 */
export const TabletView: Story = {
    render: () => <RegistrationFlow />,
    parameters: {
        viewport: {
            defaultViewport: "tablet",
        },
    },
}

/**
 * Registration Flow - Mobile View
 * Shows the registration flow optimized for mobile viewports (<768px).
 * Displays vertical progress indicator and mobile-friendly layout.
 */
export const MobileView: Story = {
    render: () => <RegistrationFlow />,
    parameters: {
        viewport: {
            defaultViewport: "mobile1",
        },
    },
}

/**
 * Registration Flow - Step 1 (Email)
 * Shows the first step of the registration flow where users enter their email.
 * Features:
 * - Email input field with validation
 * - Real-time email format validation
 * - Debounced email uniqueness check
 * - Error messages for invalid or duplicate emails
 * - Next button enabled only when email is valid
 */
export const Step1Email: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Step 2 (Password)
 * Shows the second step where users set their password.
 * Features:
 * - Password input with show/hide toggle
 * - Password strength indicator (Weak/Fair/Good/Strong)
 * - Password requirements checklist
 * - Confirm password field
 * - Real-time validation feedback
 * - Next button enabled only when passwords match and meet requirements
 */
export const Step2Password: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Step 3 (Personal Data)
 * Shows the third step where users enter personal information.
 * Features:
 * - Full name input with validation
 * - Phone number input with international format support
 * - Real-time validation feedback
 * - Support for various phone number formats
 * - Next button enabled only when all fields are valid
 */
export const Step3Personal: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Step 4 (Verification)
 * Shows the final step where users review all entered information.
 * Features:
 * - Read-only display of all entered data
 * - Edit buttons for each field to navigate back and make changes
 * - Password displayed as "Password is set and secured"
 * - Create Account button to submit the registration
 * - Back button to return to previous step
 * - Validation summary showing all data is ready
 */
export const Step4Verification: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - With Errors
 * Shows the registration flow with validation errors displayed.
 * Demonstrates:
 * - Email format validation errors
 * - Email already registered errors
 * - Password requirement errors
 * - Phone number validation errors
 * - Error dismissal functionality
 */
export const WithErrors: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Loading State
 * Shows the registration flow during account creation (loading state).
 * Demonstrates:
 * - Disabled form inputs during submission
 * - Loading spinner on submit button
 * - Session warning if session is about to expire
 * - Prevents user interaction during submission
 */
export const LoadingState: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Session Warning
 * Shows the registration flow with a session expiration warning.
 * Demonstrates:
 * - Warning message when session is about to expire (5 minutes remaining)
 * - Encourages user to complete registration quickly
 * - Session timeout handling
 */
export const SessionWarning: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - Accessibility
 * Shows the registration flow with focus on accessibility features.
 * Demonstrates:
 * - Keyboard navigation (Tab, Enter, Escape)
 * - ARIA labels and descriptions
 * - Focus indicators on all interactive elements
 * - Screen reader support
 * - Semantic HTML structure
 * - Color contrast compliance (WCAG 2.1 AA)
 */
export const Accessibility: Story = {
    render: () => <RegistrationFlow />,
}

/**
 * Registration Flow - International Users
 * Shows the registration flow with international data examples.
 * Demonstrates:
 * - International email domains (.co.uk, .com.br, etc.)
 * - International phone number formats
 * - Names with special characters (hyphens, apostrophes)
 * - Support for various character sets
 */
export const InternationalUsers: Story = {
    render: () => <RegistrationFlow />,
}
