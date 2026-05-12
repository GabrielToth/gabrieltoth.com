# Bugfix Requirements Document

## Introduction

The logout button in the dashboard sidebar is non-functional for logged-in users. When users click the logout button, no action occurs - the session remains active, cookies are not cleared, and no redirect happens. This prevents users from properly logging out of the application through the dashboard interface.

The root cause is that the `DashboardLayout` component renders the `Sidebar` component but does not pass the required `onLogout` prop. The `Sidebar` component has an optional `onLogout` prop that, when undefined, results in a logout button with no click handler. A working logout implementation exists in the `GoogleLogoutButton` component (sends POST to `/api/auth/logout` and redirects to login page), and the logout API route is fully functional.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a logged-in user clicks the logout button in the dashboard sidebar THEN the system performs no action (no session clearing, no cookie removal, no redirect)

1.2 WHEN the logout button is clicked THEN the system does not call the `/api/auth/logout` API endpoint

1.3 WHEN the logout button is clicked THEN the user remains on the dashboard page with an active session

### Expected Behavior (Correct)

2.1 WHEN a logged-in user clicks the logout button in the dashboard sidebar THEN the system SHALL send a POST request to `/api/auth/logout`

2.2 WHEN the logout API request succeeds THEN the system SHALL clear the session from the database

2.3 WHEN the logout API request succeeds THEN the system SHALL clear authentication cookies (`auth_session`, `session`, `remember_me_token`)

2.4 WHEN the logout API request succeeds THEN the system SHALL redirect the user to the login page

2.5 WHEN the logout API request fails THEN the system SHALL display an error message to the user

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the `GoogleLogoutButton` component is used THEN the system SHALL CONTINUE TO perform logout correctly (POST to `/api/auth/logout` and redirect to login)

3.2 WHEN the `/api/auth/logout` API endpoint is called directly THEN the system SHALL CONTINUE TO clear sessions and cookies correctly

3.3 WHEN users navigate between dashboard tabs (Publish, Insights, Settings) THEN the system SHALL CONTINUE TO function correctly

3.4 WHEN the sidebar is opened/closed on mobile devices THEN the system SHALL CONTINUE TO function correctly

3.5 WHEN the sidebar displays organization information THEN the system SHALL CONTINUE TO display it correctly

3.6 WHEN users interact with other sidebar elements (navigation, channel connections) THEN the system SHALL CONTINUE TO function correctly
