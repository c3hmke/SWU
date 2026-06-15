import { createRouter, createWebHistory } from 'vue-router';
import CardListPage from './features/cardList/CardListPage.vue';
import CardDetailsPage from './features/cardDetails/CardDetailsPage.vue';

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
      path: '/cards/:id',
      name: 'card-details',
      component: CardDetailsPage,
      props: route => ({ cardId: String(route.params.id) })
    }
  ]
});
