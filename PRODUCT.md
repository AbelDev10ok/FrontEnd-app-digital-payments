# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Small businesses that sell on credit and need to organize their sales or loans in installments and keep track of collections. The product is used on desktop and mobile web.

## Product Purpose

Cobros&Ventas helps a business register a sale or loan, automatically organize its installment schedule, record payments or reschedule installments, and see what remains to be collected.

## Positioning

The core workflow connects installment-based sales and loans directly to their payment schedules and collection tracking, so the business can move from registering an obligation to recording each collection or rescheduling and reviewing the outstanding balance in one product.

## Operating Context

The day-to-day workflow is to register a client and a sale or loan, follow the resulting installment schedule, record a payment when collected or move an installment to a later date, and review business metrics. The product is intended for use on the web, including mobile web. Amounts are displayed in guaraníes (Gs.).

## Capabilities and Constraints

- Register sales and loans with installment schedules.
- Manage clients, sellers, and products.
- Record installment payments and reschedule installments.
- Review sales, collections, outstanding amounts, and business metrics.
- The application has user and administrator roles.
- The frontend is a React and TypeScript SPA; its Spring Boot backend is maintained separately.
- The public pricing page presents one monthly subscription plan. Its displayed `$15.000` is explicitly marked in code as a placeholder pending MercadoPago integration, so the actual price and billing status remain unconfirmed.

## Brand Commitments

- Product name: Cobros&Ventas.
- Currency shown in the product: guaraníes (Gs.).

## Evidence on Hand

- The working product interface and workflows are in this repository.
- Spanish public product copy, a pricing page, and legal pages are implemented in `src/features/landing/`; the public header uses a wallet icon and `public/favicon.svg` is present.
- No customer testimonials, case studies, or independent performance evidence are established here.

## Product Principles

- Keep installment schedules and outstanding balances clear to the business.
- Make it practical to record a collection or reschedule an installment during daily operations.
- Support both installment-based sales and loans in the same collection workflow.
