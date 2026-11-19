import { createRouter, createWebHistory } from 'vue-router';
import AlbumsView from '../views/AlbumsView.vue';
import AlbumDetailView from '../views/AlbumDetailView.vue';
import ArtistsView from '../views/ArtistsView.vue';
import ArtistDetailView from '../views/ArtistDetailView.vue';
import FavoritesView from '../views/FavoritesView.vue';
import PlaylistsView from '../views/PlaylistsView.vue';
import PlaylistDetailView from '../views/PlaylistDetailView.vue';
import SearchView from '../views/SearchView.vue';
import SettingsView from '../views/SettingsView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const defaultView = localStorage.getItem('qn_default_view') || 'artists';
        return `/${defaultView}`;
      },
    },
    { path: '/artists', component: ArtistsView },
    { path: '/artists/:id', component: ArtistDetailView },
    { path: '/albums', component: AlbumsView },
    { path: '/albums/:id', component: AlbumDetailView },
    { path: '/favorites', component: FavoritesView },
    { path: '/playlists', component: PlaylistsView },
    { path: '/playlists/:id', component: PlaylistDetailView },
    { path: '/search', component: SearchView },
    { path: '/settings', component: SettingsView },
    { path: '/tracks', redirect: '/artists' },
  ],
});
