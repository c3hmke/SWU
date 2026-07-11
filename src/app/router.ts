import { createRouter, createWebHistory } from 'vue-router';
import CardListPage from './features/cardList/CardListPage.vue';
import CardDetailsPage from './features/cardDetails/CardDetailsPage.vue';
import BulkSearchPage from './features/bulkSearch/BulkSearchPage.vue';
import ContactPage from './features/contact/ContactPage.vue';
import { applyPageMetadata, type PageMetadata } from './metadata';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cards'
    },
    {
      path: '/cards',
      name: 'card-list',
      component: CardListPage,
      meta: {
        title: 'SWU Singles NZ | Star Wars: Unlimited Card Prices in New Zealand',
        description: 'Search Star Wars: Unlimited singles from New Zealand sellers, compare current prices, and find available SWU cards.',
        canonicalPath: '/cards'
      }
    },
    {
      path: '/bulk-search',
      name: 'bulk-search',
      component: BulkSearchPage,
      meta: {
        title: 'Bulk Search | SWU Singles NZ',
        description: 'Paste a Star Wars: Unlimited card list and find matching New Zealand seller listings.',
        canonicalPath: '/bulk-search'
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactPage,
      meta: {
        title: 'Contact | SWU Singles NZ',
        description: 'Contact SWU Singles NZ about sellers, sponsorship, feedback, or Star Wars: Unlimited listing data.',
        canonicalPath: '/contact'
      }
    },
    {
      path: '/sponsor',
      redirect: '/contact'
    },
    {
      path: '/cards/:id',
      name: 'card-details',
      component: CardDetailsPage,
      props: route => ({ cardId: String(route.params.id) }),
      meta: {
        title: 'Card Details | SWU Singles NZ',
        description: 'View Star Wars: Unlimited card details and current New Zealand seller listings.',
        canonicalPath: '/cards'
      }
    }
  ]
});

router.afterEach((route) => {
  applyPageMetadata(route.meta as Partial<PageMetadata>);
});
