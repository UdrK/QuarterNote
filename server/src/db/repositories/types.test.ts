import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { idFromText, generateId, mapTrackRow, type DbTrackRow } from './types.js';

describe('Repository Types & Helpers', () => {
  it('generates consistent 16-character SHA1 ids from text', () => {
    const id1 = idFromText('The Beatles');
    const id2 = idFromText('  the beatles  ');
    const id3 = idFromText('Pink Floyd');

    assert.equal(id1.length, 16);
    assert.equal(id1, id2, 'idFromText should normalize case and whitespace');
    assert.notEqual(id1, id3, 'different texts should produce different ids');
  });

  it('generates valid UUIDs', () => {
    const uuid1 = generateId();
    const uuid2 = generateId();

    assert.equal(typeof uuid1, 'string');
    assert.match(uuid1, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    assert.notEqual(uuid1, uuid2);
  });

  it('maps DbTrackRow to Track DTO correctly', () => {
    const row: DbTrackRow = {
      id: 'trk-1',
      filepath: '/music/rock/song.mp3',
      title: 'Comfortably Numb',
      artist_name: 'Pink Floyd',
      album_id: 'alb-1',
      album_title: 'The Wall',
      track_number: 6,
      disc_number: 2,
      year: 1979,
      duration: 382.5,
      bitrate: 320000,
      format: 'mp3',
      size: 15300000,
      mtime: 1700000000,
      has_cover: 1,
    };

    const track = mapTrackRow(row);

    assert.equal(track.id, 'trk-1');
    assert.equal(track.title, 'Comfortably Numb');
    assert.equal(track.artistName, 'Pink Floyd');
    assert.equal(track.albumTitle, 'The Wall');
    assert.equal(track.trackNumber, 6);
    assert.equal(track.discNumber, 2);
    assert.equal(track.year, 1979);
    assert.equal(track.duration, 382.5);
    assert.equal(track.hasCover, true);
  });

  it('handles nullable fields when mapping DbTrackRow', () => {
    const row: DbTrackRow = {
      id: 'trk-2',
      filepath: '/music/ambient.flac',
      title: 'Drone',
      artist_name: 'Unknown',
      album_id: 'alb-2',
      album_title: 'Singles',
      track_number: null,
      disc_number: null,
      year: null,
      duration: 120,
      bitrate: null,
      format: 'flac',
      size: 5000000,
      mtime: 1700000000,
      has_cover: 0,
    };

    const track = mapTrackRow(row);

    assert.equal(track.trackNumber, undefined);
    assert.equal(track.discNumber, undefined);
    assert.equal(track.year, undefined);
    assert.equal(track.bitrate, undefined);
    assert.equal(track.hasCover, false);
  });
});
