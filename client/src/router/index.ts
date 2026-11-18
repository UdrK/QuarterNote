import { createRouter, createWebHistory } from 'vue-router';
import AlbumsView from '../views/AlbumsView.vue';
import AlbumDetailView from '../views/AlbumDetailView.vue';
import ArtistsView from '../views/ArtistsView.vue';
import ArtistDetailView from '../views/ArtistDetailView.vue';
import TracksView from '../views/TracksView.vue';
import PlaylistsView from '../views/PlaylistsView.vue';
import PlaylistDetailView from '../views/PlaylistDetailView.vue';
import SearchView from '../views/SearchView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/albums' },
    { path: '/albums', component: AlbumsView },
    { path: '/albums/:id', component: AlbumDetailView },
    { path: '/artists', component: ArtistsView },
    { path: '/artists/:id', component: ArtistDetailView },
    { path: '/tracks', component: TracksView },
    { path: '/playlists', component: PlaylistsView },
    { path: '/playlists/:id', component: PlaylistDetailView },
    { path: '/search', component: SearchView },
  ],
});
