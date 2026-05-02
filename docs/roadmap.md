# HomeStock AI Roadmap

This roadmap keeps HomeStock AI memory-first and approval-first. Ordering remains secondary and must stay behind explicit household admin approval.

## Near Term

### Production Authentication

- Replace MVP actor switching with production auth.
- Support household invitations.
- Enforce user identity across all mutations.
- Keep role checks server-side.

### Deployment

- Deploy the Next.js app.
- Configure managed PostgreSQL.
- Add environment and secret management.
- Add basic observability for API errors and slow pages.

### Notification Preferences

- Persist read/unread notification state.
- Add role-aware notification preferences.
- Keep reminders in-app before adding external channels.

### Demo And QA Polish

- Add screenshots to README.
- Add seeded demo walkthrough links once stable deployment URLs exist.
- Keep seed fixtures deterministic.

## Medium Term

### Official Swiggy Integration

- Apply for Builders Club access.
- Confirm Instamart MCP authentication and tool schemas.
- Implement `SwiggyInstamartProvider` only through official MCP APIs.
- Add sandbox/approved-environment tests.
- Preserve final household admin approval before checkout.

### Cook Input Channels

- WhatsApp or Telegram request intake.
- Voice input for cooks/helpers.
- Photo input for handwritten grocery lists.
- Keep all external intake routed into the same pending approval workflow.

### Mobile / PWA Polish

- Installable PWA.
- Mobile-first offline-tolerant request capture.
- Better app icons and splash screens.
- Improved touch ergonomics for cooks/helpers.

## Longer Term

### Household Analytics

- Forgotten item trends.
- Duplicate prevention metrics.
- Monthly staple spend estimates.
- Household-specific reorder confidence.

### Preference Learning

- Preferred brands and pack sizes.
- Rejected substitutions.
- Budget-aware cart suggestions.
- Household-specific category defaults.

### External Notifications

- Email summaries.
- Push notifications.
- WhatsApp/SMS reminders if explicitly enabled.
- Clear user controls for notification frequency and channels.

## Explicit Non-Goals Until Ready

- No autonomous ordering.
- No payment handling outside an approved provider flow.
- No scraping.
- No undocumented Swiggy endpoints.
- No health, nutrition, or medical advice.
