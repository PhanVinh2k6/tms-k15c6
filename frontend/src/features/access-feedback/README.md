# Eduflow access feedback

Reusable React + TypeScript UI for clear `403` (permission denied) and `404` (page not found) states. The feature is isolated under `src/features/access-feedback/` so it can be added to the S1-05 app without replacing its `App.tsx`, styles, or project configuration.

## Integrate into S1-05

Copy `src/features/access-feedback/` into the same path in S1-05, then import the component where the router handles its error states:

```tsx
import { AccessFeedback } from './features/access-feedback/AccessFeedback'

<AccessFeedback
  status="forbidden"
  path={location.pathname}
  onGoBack={() => navigate(-1)}
  onGoHome={() => navigate('/')}
  onRequestAccess={() => navigate('/support/access')}
/>
```

For an unknown route, render `<AccessFeedback status="not-found" path={location.pathname} onGoHome={() => navigate('/')} />`.

The existing S1-05 app already includes React, TypeScript, and `lucide-react`.

The request-access callback should be connected to the app's real support or permission-request flow.
