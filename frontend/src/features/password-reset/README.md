# S1-03 Password reset UI

Reusable React + TypeScript UI for the password recovery flow.

## Integrate

```tsx
import PasswordReset from './features/password-reset/PasswordReset'

<PasswordReset />
```

The feature contains the request-email screen, resend cooldown, link countdown, password-update screen, validation, and the `?token=demo` demo entry point. Replace the demo timeouts in `PasswordReset.tsx` with the real password-reset API when the backend endpoint is ready.
