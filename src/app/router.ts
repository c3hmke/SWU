import { createRouter, createWebHistory } from 'vue-router';
import CardListPage from './features/cardList/CardListPage.vue';
import CardDetailsPage from './features/cardDetails/CardDetailsPage.vue';
import BulkSearchPage from './features/bulkSearch/BulkSearchPage.vue';

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
      component: CardListPage
    },
    {
      path: '/bulk-search',
      name: 'bulk-search',
      component: BulkSearchPage
    },
    {
      path: '/cards/:id',
      name: 'card-details',
      component: CardDetailsPage,
      props: route => ({ cardId: String(route.params.id) })
    }
  ]
});
