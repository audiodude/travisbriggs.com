import { createRouter, createWebHistory } from 'vue-router';
import FileList from './views/FileList.vue';
import Editor from './views/Editor.vue';
import NewPage from './views/NewPage.vue';

const routes = [
  { path: '/', component: FileList },
  { path: '/edit/:path(.*)', component: Editor },
  { path: '/new', component: NewPage },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
