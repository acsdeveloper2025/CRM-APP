# Platform Access Control by User Type

This document explains how the platform access control system works in the CRM-APP to ensure that users can only access the appropriate platform based on their role.

## Overview

The CRM-APP implements platform access control to ensure:
- Field Agents can ONLY access the mobile application
- All other user types (Backend Users, Admins, Super Admins, etc.) can ONLY access the web application

## Implementation Details

### 1. Platform Detection

The system detects the platform based on specific HTTP headers:

**For Mobile App Requests:**
- `X-App-Version`: Application version (e.g., "4.0.0")
- `X-Platform`: Must be "MOBILE"
- `X-Device-ID`: Device identifier

**For Web App Requests:**
- No special headers required (absence of mobile headers indicates web request)

### 2. Role-Based Access Control

The system checks the user's role against the detected platform:

| User Role | Allowed Platform | Restricted Platform |
|-----------|------------------|---------------------|
| FIELD_AGENT | Mobile App Only | Web App |
| BACKEND_USER | Web App Only | Mobile App |
| ADMIN | Web App Only | Mobile App |
| SUPER_ADMIN | Web App Only | Mobile App |
| MANAGER | Web App Only | Mobile App |

### 3. Middleware Implementation

The platform access control is implemented as Express middleware in `acs-backend/src/middleware/platformAccessControl.ts`:

1. **Request Detection**: The middleware checks for mobile-specific headers to determine the platform
2. **Role Retrieval**: It fetches the user's role from the database based on the username
3. **Access Validation**: It validates if the user's role is allowed on the detected platform
4. **Response Handling**: It either allows the request to proceed or blocks it with an appropriate error message

### 4. Mobile App Configuration

The mobile app is configured in `caseflow-mobile/config/environment.ts` to send the correct headers:
- `X-Platform`: "MOBILE"
- `X-App-Version`: Application version
- `X-Device-ID`: Device identifier

## Error Handling

When a user attempts to access the wrong platform, they receive a 403 Forbidden response with a descriptive error message:

- Field Agents: "Field Agents can only access the mobile application. Please use the mobile app to log in."
- Other Users: "Administrative users can only access the web application. Please use the web app to log in."

## Testing

A test script (`test_platform_access.js`) is included to verify the platform access control functionality:

1. Field agent trying to login via web (should be blocked)
2. Field agent trying to login via mobile (should be allowed)
3. Backend user trying to login via web (should be allowed)
4. Backend user trying to login via mobile (should be blocked)

## Security Considerations

1. The platform detection is based on HTTP headers, which can be spoofed. However, this is an additional security layer on top of existing authentication.
2. All authentication requests pass through this middleware before any authentication logic is executed.
3. Error messages are designed to be informative but not reveal sensitive system information.

## Maintenance

To modify the platform access control:
1. Update the role checking functions in the middleware (`isFieldAgent`, `isNonFieldAgent`)
2. Modify the platform detection logic if needed
3. Update error messages as appropriate
4. Test the changes with the provided test script