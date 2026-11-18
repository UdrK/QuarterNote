# Quarter Note ♩

**Quarter Note** è un music streamer self-hosted minimale, veloce e reattivo per la tua libreria musicale locale, pensato specificamente per girare su **ZimaBlade** (e qualsiasi host con Docker).

---

## Caratteristiche Principali

- ⚡ **Zero Bloat & Prestazioni Estreme**: Scritto in TypeScript con **Fastify**, **Vue 3** e il modulo nativo **`node:sqlite`** di Node 24. Avvio istantaneo e consumo di RAM contenuto (~30-50 MB).
- 🎚️ **Rallentatore Audio Integrato (Playback Rate)**: Controllo nativo della velocità (`0.5x`, `0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`, `2.0x` e slider continuo) per studio musicale, trascrizione o ascolto rapido.
- 🎵 **Qualità Bit-Perfect & Seek Istantaneo**: Streaming HTTP con supporto completo per header `Range` (`206 Partial Content`).
- 🖼️ **Copertine Veloci in WebP**: Estrazione da tag incorporati o file nella cartella (`cover.jpg`, `folder.png`), con generazione automatica di miniature 250x250 tramite **Sharp**.
- 📑 **Playlist & Coda**: Crea e gestisci le tue playlist, aggiungi brani alla coda e riordinali al volo con il cassetto laterale.
- 🔍 **Ricerca in Tempo Reale**: Risultati immediati raggruppati per Artisti, Album e Brani mentre digiti.
- 🚀 **Zero Login**: Accesso immediato nella tua rete locale, nessuna schermata di login né password da ricordare.

---

## Avvio Rapido con Docker (ZimaBlade)

Il modo più semplice per deployare Quarter Note sulla ZimaBlade è tramite Docker Compose:

1. Clona il repository o copia la cartella del progetto sulla ZimaBlade.
2. Modifica il volume della musica in `docker-compose.yml`:
   ```yaml
   volumes:
     - /media/mio-disco/Musica:/music:ro
     - ./data:/data
   ```
3. Avvia il container:
   ```sh
   docker compose up -d --build
   ```
4. Apri il browser all'indirizzo `http://<IP-DELLA-ZIMABLADE>:8080`.
5. Clicca su **"Riscansiona Libreria"** nella barra laterale per avviare la prima scansione dei tuoi brani.

---

## Sviluppo Locale

Requisiti: **Node.js >= 22.5.0** (raccomandato Node 24)

```sh
# 1. Installa tutte le dipendenze del monorepo
npm install

# 2. Compila i pacchetti
npm run build

# 3. Avvia in modalità sviluppo
# In un terminale avvia il server API:
npm run dev:server

# In un altro terminale avvia il client Vue Vite:
npm run dev:client
```

Il client di sviluppo sarà raggiungibile su `http://localhost:5173` con proxy automatico verso l'API su porta `8080`.

---

## Documentazione

- [Scope & Requisiti](file:///docs/scope.md)
- [Architettura Tecnica](file:///docs/architecture.md)
- [Piano di Implementazione](file:///docs/development.md)
