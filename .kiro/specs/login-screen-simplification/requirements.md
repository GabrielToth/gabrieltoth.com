# Requirements Document: Login Screen Simplification

## Introduction

This feature simplifies the authentication screen by consolidating all login methods into a unified, minimal interface. The current screen has multiple dividers, explanatory text, and separates email input from social login buttons. The redesigned screen will present all authentication methods (Google, Email, SSO, Apple, Facebook) as consistent buttons in a single row, removing unnecessary visual clutter and improving user experience.

## Glossary

- **Authentication_Screen**: The login/registration interface presented to unauthenticated users
- **SSO**: Single Sign-On provider (currently implemented)
- **Social_Login_Button**: A clickable button representing a third-party authentication provider
- **Divider**: A visual separator element (horizontal line or text)
- **Email_Authentication**: Traditional email/password login and registration flow
- **Disabled_Button**: A button that is visually distinct and non-interactive (Apple and Facebook)

## Requirements

### Requirement 1: Consolidate Authentication Methods into Button Row

**User Story:** As a user, I want to see all login options as buttons in a single row, so that I can quickly choose my preferred authentication method.

#### Acceptance Criteria

1. WHEN the Authentication_Screen is displayed, THE Screen SHALL present all authentication methods (Google, Email, SSO, Apple, Facebook) as buttons in a single horizontal row
2. WHEN the user views the button row, THE buttons SHALL be visually aligned and equally spaced
3. WHERE Apple and Facebook authentication are not yet implemented, THE corresponding buttons SHALL be displayed in a disabled state
4. WHEN a user clicks an enabled button (Google, Email, or SSO), THE Authentication_Screen SHALL initiate the corresponding authentication flow

### Requirement 2: Convert Email Authentication to Button Format

**User Story:** As a user, I want email authentication to be presented as a button like other login methods, so that the interface is consistent and minimal.

#### Acceptance Criteria

1. WHEN the Authentication_Screen is displayed, THE Email_Authentication button SHALL be presented alongside other authentication method buttons
2. WHEN a user clicks the Email_Authentication button, THE Screen SHALL transition to the email login/registration form
3. THE Email_Authentication button SHALL use the same visual style and sizing as other enabled authentication buttons

### Requirement 3: Remove Unnecessary Dividers and Text

**User Story:** As a user, I want a clean, minimal authentication screen, so that I can focus on choosing my login method without visual clutter.

#### Acceptance Criteria

1. WHEN the Authentication_Screen is displayed, THE Screen SHALL NOT display the "Ou continue com" (Or continue with) divider section
2. WHEN the Authentication_Screen is displayed, THE Screen SHALL remove all explanatory text about SSO options
3. WHEN the Authentication_Screen is displayed, THE Screen SHALL retain only essential dividers that improve visual hierarchy
4. THE Authentication_Screen layout SHALL be simplified to show only the button row and minimal supporting UI elements

### Requirement 4: Maintain Visual Consistency

**User Story:** As a designer, I want all authentication buttons to follow consistent styling, so that the interface appears polished and professional.

#### Acceptance Criteria

1. WHEN the Authentication_Screen is displayed, THE buttons SHALL have consistent height, padding, and font sizing
2. WHEN a button is in a disabled state, THE button SHALL be visually distinct from enabled buttons (reduced opacity or grayed out appearance)
3. WHEN a user hovers over an enabled button, THE button SHALL provide visual feedback (color change or shadow effect)
4. THE button row SHALL be responsive and adapt to different screen sizes while maintaining alignment

### Requirement 5: Preserve Authentication Functionality

**User Story:** As a developer, I want all existing authentication flows to continue working, so that users can still log in via their preferred method.

#### Acceptance Criteria

1. WHEN a user clicks the Google button, THE existing Google OAuth flow SHALL execute without changes
2. WHEN a user clicks the SSO button, THE existing SSO authentication flow SHALL execute without changes
3. WHEN a user clicks the Email button, THE email login/registration form SHALL display and function as before
4. WHEN a user completes authentication via any method, THE user SHALL be logged in and redirected to the appropriate destination

