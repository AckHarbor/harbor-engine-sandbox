# AckHarbor™ Harbor Engine Sandbox

A free practice HL7® v2 interface engine that runs entirely in your web browser, offline. It simulates hospital systems at the fictional Penford Medical Center so you can learn how interfaces are built and supported, with no install, server or account.

**Try it or download it:** https://ackharbor.com/download

> ⚠️ **No real patient data. Do not load PHI.** This is a training tool, not a production engine or medical device. All patients, providers, phone numbers and identifiers in the samples are invented.

## Features

- Up to 3 practice channels with MLLP-style listeners, filters, transformers and routing
- Simulated sending systems with start/stop traffic, ACK/NAK results and an error queue
- Message browser with raw and transformed views, reprocess and dismiss
- Draft and deploy workflow with version history and rollback
- Code tables, alerts, built-in help and a guided tour
- Includes the offline viewers AckHarbor Spyglass™ (HL7 v2) and AckHarbor Chart™ (FHIR® R4 JSON)
- Plain HTML, CSS and JavaScript; work is saved only in your browser's local storage

## How to run

1. Clone or download this repository.
2. Open `START-HERE.html` (or `sandbox/index.html`) in a modern browser.

No build step and no dependencies. Nothing is sent over the network.

## Project layout

- `START-HERE.html`: landing page
- `sandbox/`: the engine (`he*.js`, `engine.js`, styles)
- `sandbox/viewers/`: Spyglass™ and Chart™ offline viewers, plus a synthetic 120-message practice batch

## License

[PolyForm Noncommercial 1.0.0](LICENSE). Copyright © 2026 DaRider Tech LLC. Free for learning, teaching and other noncommercial use. Commercial use, resale or hosting it as a service needs written permission from DaRider Tech LLC (support@ackharbor.com).

HL7® and FHIR® are registered trademarks of Health Level Seven International; use does not imply endorsement.

More free tools and training at [ackharbor.com](https://ackharbor.com).
