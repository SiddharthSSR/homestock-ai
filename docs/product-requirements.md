# HomeStock AI Product Requirements

## Product Vision

HomeStock AI is a shared household grocery brain. It collects grocery needs from household members and cooks/helpers, turns messy natural language into structured requests, reduces duplicates, remembers recurring purchases, and prepares an orderable cart only after explicit household admin approval.

## Problem Statement

Household grocery needs are often scattered across verbal reminders, WhatsApp messages, notes, and memory. This creates forgotten essentials, duplicate items, fragmented small orders, and unclear ownership. The product centralizes requests and makes the grocery workflow visible, structured, and approval-driven.

## Personas

- Household Admin: owns the household setup, approves grocery requests and final carts, manages preferences and future Swiggy access.
- Household Member: adds grocery requests, sees pending items, marks urgency, comments, and suggests edits.
- Cook / Helper: submits grocery needs in simple language without needing full admin access.

## MVP Features

- Household creation and member management with `ADMIN`, `MEMBER`, and `COOK` roles.
- Natural-language grocery request input.
- Parser fallback for comma-separated items, `and` separated items, quantities, units, and common Hindi/Hinglish grocery terms.
- Canonical item normalization and duplicate/synonym handling.
- Grouped grocery dashboard with status, urgency, requester, quantity, notes, and admin actions.
- Approval workflow from pending request to approved item to cart draft to approved cart.
- Mock grocery provider with fake catalog, pricing, availability, and substitutions.
- Swiggy Instamart provider stub behind a commerce provider interface.
- Recurring grocery pattern data model and lightweight suggestion panel.
- Audit log for meaningful mutations.

## Non-Goals

- No fully autonomous ordering.
- No payment handling outside approved Swiggy flows.
- No scraping.
- No competitor price comparison.
- No hardcoded undocumented Swiggy endpoints.
- No complex home inventory scanning.
- No nutrition or medical advice.
- No overbuilt multi-agent architecture.
- No order placement without explicit admin approval.

## User Journeys

1. Cook adds: "Aata, tomato, onion, oil, coriander khatam ho raha hai."
2. The parser extracts items, normalizes names, detects duplicates, and adds or merges pending requests.
3. Admin reviews pending groceries grouped by category.
4. Admin approves or rejects each item, edits quantity if needed, or marks it purchased offline.
5. Admin prepares a mock cart from approved requests.
6. Admin reviews product selection, availability, substitutions, estimated prices, and total.
7. Admin explicitly approves the cart. Real checkout remains disabled until Swiggy MCP access is implemented.

## Success Metrics

- Grocery items captured per household per week.
- Reduction in forgotten grocery items.
- Duplicate items merged.
- Approved carts created.
- Orders placed after explicit approval once real commerce integration exists.
- Average time from item request to cart preparation.
- Weekly active households.
- Four-week household retention.
