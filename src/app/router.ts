import { createRouter, createWebHistory } from 'vue-router';
import CardDetailsPage from './features/cardDetails/CardDetailsPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cards/SOR005'
    },
    {
      path: '/cards/:id',
      name: 'card-details',
      component: CardDetailsPage,
      props: route => ({ cardId: String(route.params.id) })
    }
  ]
});
