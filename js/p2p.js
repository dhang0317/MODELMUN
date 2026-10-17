// p2p.js - Ultra Fast Zero-Latency Direct Sync (BroadcastChannel + WebRTC DataChannel)
(function (window) {
  'use strict';

  const P2PSync = {
    broadcastChannel: null,
    peer: null,
    connections: [], // Active WebRTC Peer connections (Chair mode)
    chairConn: null, // Active connection to Chair (Viewer mode)
    isReady: false,

    init() {
      // 1. Initialize local BroadcastChannel (0.00ms latency for dual-monitor / projector window)
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.broadcastChannel = new BroadcastChannel('mun_instant_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && typeof event.data === 'object') {
              if (state.isViewerMode) {
                this.applyRemotePayload(event.data);
              }
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel error:', e);
        }
      }

      // 2. Initialize WebRTC P2P using PeerJS
      if (typeof Peer !== 'undefined') {
        this.initPeerJS();
      } else {
        window.addEventListener('load', () => {
          if (typeof Peer !== 'undefined') this.initPeerJS();
        });
      }
    },

    initPeerJS() {
      if (!state.roomId) return;
      const roomIdSanitized = state.roomId.replace(/[^a-zA-Z0-9_-]/g, '');

      if (!state.isViewerMode) {
        // Chair Mode: Listen on chair room peer ID
        const chairPeerId = 'munchair' + roomIdSanitized;
        try {
          this.peer = new Peer(chairPeerId, { debug: 0 });

          this.peer.on('open', (id) => {
            this.isReady = true;
          });

          this.peer.on('connection', (conn) => {
            this.connections.push(conn);
            conn.on('open', () => {
              conn.send(getFullStatePayload());
            });
            conn.on('close', () => {
              this.connections = this.connections.filter(c => c !== conn);
            });
            conn.on('error', () => {
              this.connections = this.connections.filter(c => c !== conn);
            });
          });

          this.peer.on('error', (err) => {
            console.log('Chair Peer notice:', err.type);
          });
        } catch (e) {
          console.warn('Chair PeerJS init failed:', e);
        }
      } else {
        // Viewer (Delegate) Mode: Connect directly to Chair's Peer ID
        const chairPeerId = 'munchair' + roomIdSanitized;
        try {
          this.peer = new Peer({ debug: 0 });

          this.peer.on('open', () => {
            this.connectToChair(chairPeerId);
          });

          this.peer.on('error', (err) => {
            console.log('Delegate Peer notice:', err.type);
          });
        } catch (e) {
          console.warn('Viewer PeerJS init failed:', e);
        }
      }
    },

    connectToChair(chairPeerId) {
      if (!this.peer || this.peer.destroyed) return;
      try {
        const conn = this.peer.connect(chairPeerId, { reliable: true });

        conn.on('open', () => {
          this.chairConn = conn;
          const p2pBadge = document.getElementById('badge-p2p-live');
          if (p2pBadge) p2pBadge.classList.remove('hidden');
        });

        conn.on('data', (data) => {
          if (data && typeof data === 'object') {
            this.applyRemotePayload(data);
          }
        });

        conn.on('close', () => {
          this.chairConn = null;
          const p2pBadge = document.getElementById('badge-p2p-live');
          if (p2pBadge) p2pBadge.classList.add('hidden');
          setTimeout(() => this.connectToChair(chairPeerId), 3000);
        });

        conn.on('error', () => {
          this.chairConn = null;
        });
      } catch (e) {
        console.warn('P2P connectToChair error:', e);
      }
    },

    broadcast(payload) {
      if (!payload) return;

      // 1. Instant local broadcast (0.00ms latency)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(payload);
        } catch (e) {}
      }

      // 2. WebRTC P2P direct push (0.03s latency)
      if (this.connections.length > 0) {
        for (let i = 0; i < this.connections.length; i++) {
          const conn = this.connections[i];
          if (conn && conn.open) {
            try {
              conn.send(payload);
            } catch (e) {}
          }
        }
      }
    },

    applyRemotePayload(data) {
      if (!data) return;
      if (data.lastUpdated && state.lastUpdated && data.lastUpdated <= state.lastUpdated) {
        return;
      }
      state.lastUpdated = data.lastUpdated || Date.now();
      loadStateFromData(data);
      updateAvailableCountriesPool();
      renderAll();
    },

    openProjectorWindow() {
      const room = state.roomId || 'room-projector';
      const url = `${window.location.origin}${window.location.pathname}?view=1&room=${encodeURIComponent(room)}&projector=1`;
      const w = window.open(url, 'MUN_PROJECTOR_WINDOW', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
      if (w) {
        w.focus();
        showToast('已開啟零延遲投影視窗！可直接拖曳至投影螢幕', 'success', 3500);
      } else {
        showToast('請允許瀏覽器彈出視窗以啟用投影功能', 'error');
      }
    }
  };

  window.P2PSync = P2PSync;
})(window);
