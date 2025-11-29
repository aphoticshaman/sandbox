/**
 * Network Core
 * WebSocket signaling + WebRTC P2P for low-latency multiplayer puzzles
 * Designed for streamers: native TikTok Live + Twitch integration
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface NetworkConfig {
  signalingServer: string;
  iceServers: RTCIceServer[];
  maxPeers: number;
  reconnectAttempts: number;
  heartbeatInterval: number;
}

export interface PeerInfo {
  id: string;
  displayName: string;
  avatar?: string;
  platform: 'direct' | 'steam' | 'tiktok' | 'twitch';
  isStreamer: boolean;
  latency: number;
  joinedAt: number;
}

export interface NetworkMessage {
  type: string;
  payload: any;
  senderId: string;
  timestamp: number;
  reliable: boolean;  // Use data channel reliability
  sequence?: number;  // For ordering
}

const DEFAULT_CONFIG: NetworkConfig = {
  signalingServer: 'wss://orthogonal-signal.example.com',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN servers would go here for NAT traversal
  ],
  maxPeers: 8,  // 8-player puzzles max
  reconnectAttempts: 5,
  heartbeatInterval: 1000,
};

export class NetworkCore {
  private config: NetworkConfig;
  private socket: WebSocket | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private peerInfo: Map<string, PeerInfo> = new Map();

  private localId: string = '';
  private roomId: string = '';
  private state: ConnectionState = 'disconnected';

  // Message handling
  private messageHandlers: Map<string, (msg: NetworkMessage) => void> = new Map();
  private messageQueue: NetworkMessage[] = [];
  private sequenceNumber: number = 0;

  // Reconnection
  private reconnectAttempt: number = 0;
  private reconnectTimer: number | null = null;

  // Latency tracking
  private latencyHistory: Map<string, number[]> = new Map();

  // Events
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.localId = this.generateId();
  }

  // ========================================
  // Connection Management
  // ========================================

  async connect(roomId: string): Promise<void> {
    if (this.state === 'connected') {
      await this.disconnect();
    }

    this.roomId = roomId;
    this.state = 'connecting';
    this.emit('stateChange', this.state);

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.config.signalingServer);

      this.socket.onopen = () => {
        console.log('[Network] Signaling connected');
        this.sendSignal('join', { roomId, localId: this.localId });
        this.startHeartbeat();
        this.state = 'connected';
        this.emit('stateChange', this.state);
        resolve();
      };

      this.socket.onclose = () => {
        this.handleDisconnect();
      };

      this.socket.onerror = (error) => {
        console.error('[Network] WebSocket error:', error);
        reject(error);
      };

      this.socket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };
    });
  }

  async disconnect(): Promise<void> {
    // Close all peer connections
    for (const [peerId, pc] of this.peers) {
      pc.close();
    }
    this.peers.clear();
    this.dataChannels.clear();
    this.peerInfo.clear();

    // Close signaling
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.state = 'disconnected';
    this.emit('stateChange', this.state);
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempt < this.config.reconnectAttempts) {
      this.state = 'reconnecting';
      this.emit('stateChange', this.state);

      const delay = Math.pow(2, this.reconnectAttempt) * 1000;  // Exponential backoff
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempt++;
        this.connect(this.roomId);
      }, delay);
    } else {
      this.state = 'disconnected';
      this.emit('stateChange', this.state);
      this.emit('connectionFailed', { attempts: this.reconnectAttempt });
    }
  }

  // ========================================
  // Signaling (WebSocket)
  // ========================================

  private sendSignal(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data, from: this.localId }));
    }
  }

  private async handleSignalingMessage(msg: any): Promise<void> {
    const { type, data, from } = msg;

    switch (type) {
      case 'room-joined':
        console.log('[Network] Joined room:', data.roomId);
        // Connect to existing peers
        for (const peerId of data.peers) {
          await this.createPeerConnection(peerId, true);
        }
        break;

      case 'peer-joined':
        console.log('[Network] Peer joined:', from);
        await this.createPeerConnection(from, false);
        break;

      case 'peer-left':
        this.handlePeerLeft(from);
        break;

      case 'offer':
        await this.handleOffer(from, data);
        break;

      case 'answer':
        await this.handleAnswer(from, data);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(from, data);
        break;

      case 'peer-info':
        this.peerInfo.set(from, data);
        this.emit('peerUpdated', { peerId: from, info: data });
        break;
    }
  }

  // ========================================
  // WebRTC Peer Connections
  // ========================================

  private async createPeerConnection(peerId: string, initiator: boolean): Promise<void> {
    const pc = new RTCPeerConnection({ iceServers: this.config.iceServers });
    this.peers.set(peerId, pc);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('ice-candidate', {
          target: peerId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log(`[Network] Peer ${peerId} state: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.handlePeerDisconnect(peerId);
      }
    };

    // Data channel handling
    if (initiator) {
      // Create data channels
      const reliableChannel = pc.createDataChannel('reliable', { ordered: true });
      const unreliableChannel = pc.createDataChannel('unreliable', {
        ordered: false,
        maxRetransmits: 0
      });

      this.setupDataChannel(peerId, reliableChannel, 'reliable');
      this.setupDataChannel(peerId, unreliableChannel, 'unreliable');

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal('offer', { target: peerId, sdp: offer });
    } else {
      pc.ondatachannel = (event) => {
        const channelType = event.channel.label === 'reliable' ? 'reliable' : 'unreliable';
        this.setupDataChannel(peerId, event.channel, channelType);
      };
    }
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel, type: string): void {
    const key = `${peerId}-${type}`;

    channel.onopen = () => {
      console.log(`[Network] Data channel open: ${peerId} (${type})`);
      this.dataChannels.set(key, channel);

      if (type === 'reliable') {
        this.emit('peerConnected', { peerId });
        this.flushMessageQueue(peerId);
      }
    };

    channel.onclose = () => {
      console.log(`[Network] Data channel closed: ${peerId} (${type})`);
      this.dataChannels.delete(key);
    };

    channel.onmessage = (event) => {
      const msg: NetworkMessage = JSON.parse(event.data);
      this.handlePeerMessage(peerId, msg);
    };
  }

  private async handleOffer(peerId: string, data: any): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.sendSignal('answer', { target: peerId, sdp: answer });
  }

  private async handleAnswer(peerId: string, data: any): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
  }

  private async handleIceCandidate(peerId: string, data: any): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }

  private handlePeerLeft(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) pc.close();

    this.peers.delete(peerId);
    this.dataChannels.delete(`${peerId}-reliable`);
    this.dataChannels.delete(`${peerId}-unreliable`);
    this.peerInfo.delete(peerId);
    this.latencyHistory.delete(peerId);

    this.emit('peerLeft', { peerId });
  }

  private handlePeerDisconnect(peerId: string): void {
    // Try to reconnect before fully removing
    console.log(`[Network] Peer disconnected, attempting reconnect: ${peerId}`);
    // For now, treat as left
    this.handlePeerLeft(peerId);
  }

  // ========================================
  // Messaging
  // ========================================

  send(type: string, payload: any, options: { reliable?: boolean; target?: string } = {}): void {
    const msg: NetworkMessage = {
      type,
      payload,
      senderId: this.localId,
      timestamp: Date.now(),
      reliable: options.reliable ?? true,
      sequence: this.sequenceNumber++,
    };

    if (options.target) {
      this.sendToPeer(options.target, msg);
    } else {
      this.broadcast(msg);
    }
  }

  private sendToPeer(peerId: string, msg: NetworkMessage): void {
    const channelType = msg.reliable ? 'reliable' : 'unreliable';
    const channel = this.dataChannels.get(`${peerId}-${channelType}`);

    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(msg));
    } else {
      // Queue for later
      if (msg.reliable) {
        this.messageQueue.push({ ...msg, senderId: peerId });
      }
    }
  }

  private broadcast(msg: NetworkMessage): void {
    const channelType = msg.reliable ? 'reliable' : 'unreliable';

    for (const [key, channel] of this.dataChannels) {
      if (key.endsWith(channelType) && channel.readyState === 'open') {
        channel.send(JSON.stringify(msg));
      }
    }
  }

  private flushMessageQueue(peerId: string): void {
    const toSend = this.messageQueue.filter(m => m.senderId === peerId);
    this.messageQueue = this.messageQueue.filter(m => m.senderId !== peerId);

    for (const msg of toSend) {
      this.sendToPeer(peerId, msg);
    }
  }

  private handlePeerMessage(peerId: string, msg: NetworkMessage): void {
    // Update latency if this is a pong
    if (msg.type === 'pong') {
      const latency = Date.now() - msg.payload.pingTime;
      this.updateLatency(peerId, latency);
      return;
    }

    // Handle ping
    if (msg.type === 'ping') {
      this.send('pong', { pingTime: msg.payload.pingTime }, { target: peerId, reliable: false });
      return;
    }

    // Route to handler
    const handler = this.messageHandlers.get(msg.type);
    if (handler) {
      handler(msg);
    }

    // Emit for listeners
    this.emit('message', { peerId, msg });
  }

  on(type: string, handler: (msg: NetworkMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  // ========================================
  // Latency Tracking
  // ========================================

  private updateLatency(peerId: string, latency: number): void {
    if (!this.latencyHistory.has(peerId)) {
      this.latencyHistory.set(peerId, []);
    }

    const history = this.latencyHistory.get(peerId)!;
    history.push(latency);

    if (history.length > 10) {
      history.shift();
    }

    // Update peer info with average latency
    const info = this.peerInfo.get(peerId);
    if (info) {
      info.latency = history.reduce((a, b) => a + b, 0) / history.length;
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      // Ping all peers
      for (const peerId of this.peers.keys()) {
        this.send('ping', { pingTime: Date.now() }, { target: peerId, reliable: false });
      }
    }, this.config.heartbeatInterval);
  }

  // ========================================
  // Event System
  // ========================================

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  removeEventListener(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  // ========================================
  // Utilities
  // ========================================

  private generateId(): string {
    return 'peer-' + Math.random().toString(36).substr(2, 9);
  }

  getLocalId(): string {
    return this.localId;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getPeers(): PeerInfo[] {
    return Array.from(this.peerInfo.values());
  }

  getPeerCount(): number {
    return this.peerInfo.size;
  }

  getAverageLatency(): number {
    const latencies = Array.from(this.peerInfo.values()).map(p => p.latency);
    if (latencies.length === 0) return 0;
    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }
}
