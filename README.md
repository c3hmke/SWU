# Star Wars: Unlimited Singles NZ

This project develops a Star Wars Unlimited TCG singles aggregator, indexing cards and prices from various New Zealand 
online sellers. It employs a modern serverless architecture built on Cloudflare Workers and Pages, with a Vue.js frontend, 
to provide a fast and SEO-friendly user experience. 

Key technical decisions include leveraging Cloudflare Pages Functions for edge-side rendering to inject dynamic content 
and SEO metadata, and utilizing Cloudflare Workers for its backend API, scheduled data synchronization, and robust 
database persistence with Cloudflare D1. 

The system efficiently scrapes and aggregates card listings, offering users a centralized platform to compare prices and availability.

### Key Decisions

- **Hybrid SSR/SPA architecture with Cloudflare Pages Functions**: Dynamically injects SEO-critical content and high-value card listings into a static Vue.js app shell at the edge, combining the benefits of fast static sites with server-side rendering for SEO and improved first-contentful-paint.
- **Unified serverless platform (Cloudflare Workers, Pages, D1, Queues)**: Leverages Cloudflare's integrated ecosystem for backend APIs, scheduled data aggregation, and database persistence, streamlining development, deployment, and scalability.
- **Pluggable seller synchronization adapters**: Employs a clear adapter pattern (`createAdapterRegistry`) to integrate with diverse third-party seller websites, making it straightforward to add new data sources for aggregation.
- **Automated CI/CD for worker deployment**: Implements a GitHub Actions workflow to automatically type-check and deploy the Cloudflare Worker upon push to `main`, ensuring continuous integration and reliable releases.

<small>generated using [repo-lens](https://repo-lens-blue.vercel.app)</small>