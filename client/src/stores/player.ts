import { reactive, ref } from 'vue';
import type { Track, PlaybackRate, RepeatMode } from '@quarter-note/shared';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const audio = new Audio();

const savedVolume = parseFloat(localStorage.getItem('qn_volume') || '0.8');
const savedRate = parseFloat(localStorage.getItem('qn_rate') || '1.0') as PlaybackRate;
const savedRepeat = (localStorage.getItem('qn_repeat') || 'off') as RepeatMode;

export const playerState = reactive({
  currentTrack: null as Track | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: savedRate || 1.0,
  volume: savedVolume,
  isMuted: false,
  repeatMode: savedRepeat,
  shuffle: false,
  queue: [] as Track[],
  queueIndex: -1,
  isQueueOpen: false,
  isLoading: false,
});

// Configure audio instance
audio.volume = playerState.volume;
audio.playbackRate = playerState.playbackRate;

audio.addEventListener('timeupdate', () => {
  playerState.currentTime = audio.currentTime;
});

audio.addEventListener('loadedmetadata', () => {
  playerState.duration = audio.duration;
  playerState.isLoading = false;
  audio.playbackRate = playerState.playbackRate;
});

audio.addEventListener('play', () => {
  playerState.isPlaying = true;
});

audio.addEventListener('pause', () => {
  playerState.isPlaying = false;
});

audio.addEventListener('waiting', () => {
  playerState.isLoading = true;
});

audio.addEventListener('playing', () => {
  playerState.isLoading = false;
  playerState.isPlaying = true;
});

audio.addEventListener('ended', () => {
  if (playerState.repeatMode === 'one') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playerActions.next(true);
  }
});

audio.addEventListener('error', (e) => {
  console.error('Audio playback error:', e);
  playerState.isLoading = false;
  playerState.isPlaying = false;
});

export const playerActions = {
  playTrack(track: Track, newQueue?: Track[]) {
    playerState.currentTrack = track;

    if (newQueue && newQueue.length > 0) {
      playerState.queue = [...newQueue];
      playerState.queueIndex = playerState.queue.findIndex(t => t.id === track.id);
    } else {
      if (playerState.queue.length === 0 || !playerState.queue.some(t => t.id === track.id)) {
        playerState.queue = [track];
        playerState.queueIndex = 0;
      } else {
        playerState.queueIndex = playerState.queue.findIndex(t => t.id === track.id);
      }
    }

    playerState.isLoading = true;
    audio.src = `/api/stream/${track.id}`;
    audio.playbackRate = playerState.playbackRate;
    audio.play().catch(err => {
      console.warn('Autoplay prevented or failed:', err);
      playerState.isLoading = false;
    });
  },

  togglePlay() {
    if (!playerState.currentTrack && playerState.queue.length > 0) {
      this.playTrack(playerState.queue[0]);
      return;
    }
    if (playerState.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  },

  next(fromAutoEnd = false) {
    if (playerState.queue.length === 0) return;

    if (playerState.shuffle) {
      const nextIdx = Math.floor(Math.random() * playerState.queue.length);
      playerState.queueIndex = nextIdx;
      this.playTrack(playerState.queue[nextIdx]);
      return;
    }

    if (playerState.queueIndex < playerState.queue.length - 1) {
      playerState.queueIndex++;
      this.playTrack(playerState.queue[playerState.queueIndex]);
    } else if (playerState.repeatMode === 'all' || !fromAutoEnd) {
      playerState.queueIndex = 0;
      this.playTrack(playerState.queue[0]);
    } else {
      playerState.isPlaying = false;
    }
  },

  prev() {
    // If playing for more than 3 seconds, restart current track
    if (playerState.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (playerState.queueIndex > 0) {
      playerState.queueIndex--;
      this.playTrack(playerState.queue[playerState.queueIndex]);
    } else if (playerState.queue.length > 0) {
      playerState.queueIndex = playerState.queue.length - 1;
      this.playTrack(playerState.queue[playerState.queueIndex]);
    }
  },

  seek(seconds: number) {
    audio.currentTime = seconds;
    playerState.currentTime = seconds;
  },

  setRate(rate: PlaybackRate) {
    playerState.playbackRate = rate;
    audio.playbackRate = rate;
    localStorage.setItem('qn_rate', String(rate));
  },

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    playerState.volume = clamped;
    playerState.isMuted = clamped === 0;
    audio.volume = clamped;
    localStorage.setItem('qn_volume', String(clamped));
  },

  toggleMute() {
    if (playerState.isMuted) {
      audio.volume = playerState.volume || 0.5;
      playerState.isMuted = false;
    } else {
      audio.volume = 0;
      playerState.isMuted = true;
    }
  },

  toggleRepeat() {
    if (playerState.repeatMode === 'off') {
      playerState.repeatMode = 'all';
    } else if (playerState.repeatMode === 'all') {
      playerState.repeatMode = 'one';
    } else {
      playerState.repeatMode = 'off';
    }
    localStorage.setItem('qn_repeat', playerState.repeatMode);
  },

  toggleShuffle() {
    playerState.shuffle = !playerState.shuffle;
  },

  toggleQueue() {
    playerState.isQueueOpen = !playerState.isQueueOpen;
  },

  addToQueue(track: Track) {
    playerState.queue.push(track);
  },

  playNext(track: Track) {
    if (playerState.queueIndex >= 0) {
      playerState.queue.splice(playerState.queueIndex + 1, 0, track);
    } else {
      playerState.queue.push(track);
    }
  },

  removeFromQueue(index: number) {
    if (index === playerState.queueIndex) {
      this.next();
    }
    playerState.queue.splice(index, 1);
    if (index < playerState.queueIndex) {
      playerState.queueIndex--;
    }
  },

  clearQueue() {
    const current = playerState.currentTrack;
    if (current) {
      playerState.queue = [current];
      playerState.queueIndex = 0;
    } else {
      playerState.queue = [];
      playerState.queueIndex = -1;
    }
  },

  moveQueueItem(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= playerState.queue.length || toIndex < 0 || toIndex >= playerState.queue.length) return;
    const [item] = playerState.queue.splice(fromIndex, 1);
    playerState.queue.splice(toIndex, 0, item);
    // Adjust current playing index
    if (fromIndex === playerState.queueIndex) {
      playerState.queueIndex = toIndex;
    } else if (fromIndex < playerState.queueIndex && toIndex >= playerState.queueIndex) {
      playerState.queueIndex--;
    } else if (fromIndex > playerState.queueIndex && toIndex <= playerState.queueIndex) {
      playerState.queueIndex++;
    }
  },

  jumpToQueueIndex(index: number) {
    if (index >= 0 && index < playerState.queue.length) {
      playerState.queueIndex = index;
      this.playTrack(playerState.queue[index]);
    }
  },
};
