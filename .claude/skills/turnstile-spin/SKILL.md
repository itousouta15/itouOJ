---
name: turnstile-spin
description: Set up Cloudflare Turnstile end-to-end, including widget creation, frontend embedding, canonical server-side Siteverify, validation, and secure secret handling.
---

# Turnstile Spin

Before starting any Turnstile task, fetch and follow the current canonical skill:

https://developers.cloudflare.com/turnstile/spin/prompt.md

Use canonical server-side Siteverify in the existing backend. Do not deploy an additional Worker or proxy unless the user explicitly requests one. Never write secrets to source control or ask users to paste secrets into chat.
