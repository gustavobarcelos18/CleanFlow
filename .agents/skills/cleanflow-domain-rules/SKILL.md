---
name: cleanflow-domain-rules
description: Use for any CleanFlow feature that changes scheduling, waiting list, fit-in (encaixe), no-show prediction, reminders and alarms, automations, WhatsApp communication, financial/cash, multi-unit organizations, roles and permissions, LGPD retention or consent. DRAFT extracted from README and docs; items marked A CONFIRMAR need the maintainer.
---

# CleanFlow Domain Rules (DRAFT)

This file was extracted from `README.md` and `docs/`. It states only what those documents say. Anything marked **A CONFIRMAR** is not a decision: ask the maintainer (`AGENTS.md` rule 16) before relying on it. Do not add rules here that nobody confirmed.

## 1. Tenants, organizations and units

- The system is multi-tenant: each business (tenant) is isolated from the others (`README.md`).
- An organization groups several tenants/units. Multi-unit organizations get a consolidated view and a governance panel (`docs/GUIA_ACESSO_GOVERNANCA.md`).
- The governance panel is for tenants with an `organization_id` only; solo tenants have no access. Allowed roles: `org_admin`, `org_finance`, and `admin_tenant` / `financeiro_tenant` when the tenant belongs to an organization (same document).
- Business segments (health, legal, beauty, workshop, ...) change terminology and features through the segment store (`src/stores/useSegmentStore.ts`, `src/components/{legal,beauty,workshop}/`). **A CONFIRMAR:** the official list of segments and what each one enables.

## 2. Scheduling

- The agenda supports several professionals, rescheduling, cancellation, availability management and a waiting list (`README.md`). Conflict detection lives in `src/lib/scheduleConflicts.ts`.
- **A CONFIRMAR:** rules for overbooking, minimum notice for cancellation/rescheduling, and who may edit or cancel an appointment.

## 3. Reminders, confirmation and alarms

- Confirmation and reminders are automatable and depend on the configured integrations (`README.md`). The default flow described in `docs/CONFIRMACAO_AUTOMATICA_E_ENCAIXE_IA.md` sends a confirmation at D-2 and a final reminder at H-3.
- Alarms, reminders and tasks have priorities, channels (system, e-mail, WhatsApp, all), recurrence and links to appointments (`docs/ALARMES_LEMBRETES_IMPLEMENTACAO.md`).
- **A CONFIRMAR:** which reminders are mandatory, quiet hours, and opt-out rules for clients.

## 4. No-show prediction and fit-in (encaixe)

- A no-show risk score exists (`src/domain/analytics/noShowModel.ts`, function `calcular-risco-no-show`). The documents use thresholds such as risk above 70% or 80% in example flows.
- Automatic fit-in offers freed slots (for example after a late cancellation) to clients, tracks offers and acceptance rate (`docs/ENCAIXE_AUTOMATICO_IMPLEMENTACAO.md`, `src/domain/encaixe/`).
- **A CONFIRMAR:** the official risk thresholds, how long a fit-in offer stays valid, and who is offered a slot first.

## 5. Communication (WhatsApp)

- Messages go through the Meta Cloud API (edge functions) or the own worker (`whatsapp-worker/`); credits and phone-number subscriptions are billed (`supabase/functions/*credito*`, `*numero*`).
- **A CONFIRMAR:** credit expiry rules, what happens when credits run out, and consent required before messaging a client.

## 6. Financial

- Cash in/out, daily cash (`CaixaDiario`), operational reports by period and by unit, and service orders/budgets/purchases where applicable (`README.md`).
- **A CONFIRMAR:** commission rules, refund rules and plan limits (`usePlanLimits`).

## 7. Roles and permissions

See `AGENTS.md`, "Roles". The role model is known to be inconsistent; do not invent permissions. **A CONFIRMAR** the official permission matrix before changing who can do what.

## 8. LGPD

- Collect the minimum; access by role; export and deletion on demand where applicable; audit trail for critical actions (`README.md`).
- Retention, consent and anonymization have their own features (`apply-retention-policies`, `ConsentManagement`, `AnonymizationManager`). **A CONFIRMAR:** retention periods per data type.

## 9. Support

- The platform has its own support team (platform roles in `AGENTS.md`, "Roles": `system_users.system_role` and the `support_role` enum in `usuarios_suporte`) and a ticket system (`SupportTickets`). Ticket priorities and response targets are defined in `docs/IMPLEMENTACOES_FINAIS.md` (for example urgent: 4 hours, high: 24 hours). **A CONFIRMAR:** which support role may do what.
