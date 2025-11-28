/**
 * Text Chat System
 * Party chat + quick comms for multiplayer puzzles
 * Streamlined for gameplay - doesn't obstruct, but always accessible
 */

import { NetworkCore, NetworkMessage } from './NetworkCore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'system' | 'quickcomm' | 'emote';
  timestamp: number;
}

export interface QuickComm {
  id: string;
  label: string;
  icon: string;
  key: string;  // Keyboard shortcut
}

// Quick communication options for puzzle coordination
export const QUICK_COMMS: QuickComm[] = [
  { id: 'look', label: 'Look here', icon: '👁', key: '1' },
  { id: 'wait', label: 'Wait', icon: '✋', key: '2' },
  { id: 'go', label: 'Go!', icon: '→', key: '3' },
  { id: 'help', label: 'Need help', icon: '?', key: '4' },
  { id: 'ready', label: 'Ready', icon: '✓', key: '5' },
  { id: 'nice', label: 'Nice!', icon: '✨', key: '6' },
  { id: 'think', label: 'Thinking...', icon: '🧠', key: '7' },
  { id: 'sync', label: 'Sync up', icon: '⟲', key: '8' },
];

export class TextChat {
  private network: NetworkCore;
  private messages: ChatMessage[] = [];
  private maxMessages: number = 100;
  private localPlayerName: string = '';

  // Events
  private onMessage: ((msg: ChatMessage) => void) | null = null;

  constructor(network: NetworkCore) {
    this.network = network;
    this.setupNetworkHandlers();
  }

  private setupNetworkHandlers(): void {
    this.network.on('chat-message', this.handleChatMessage.bind(this));
    this.network.on('quick-comm', this.handleQuickComm.bind(this));
  }

  setLocalPlayerName(name: string): void {
    this.localPlayerName = name;
  }

  send(content: string): void {
    if (!content.trim()) return;

    const msg: ChatMessage = {
      id: this.generateId(),
      senderId: this.network.getLocalId(),
      senderName: this.localPlayerName,
      content: content.trim(),
      type: 'text',
      timestamp: Date.now(),
    };

    // Add locally
    this.addMessage(msg);

    // Send to peers
    this.network.send('chat-message', msg);
  }

  sendQuickComm(commId: string): void {
    const comm = QUICK_COMMS.find(c => c.id === commId);
    if (!comm) return;

    const msg: ChatMessage = {
      id: this.generateId(),
      senderId: this.network.getLocalId(),
      senderName: this.localPlayerName,
      content: comm.label,
      type: 'quickcomm',
      timestamp: Date.now(),
    };

    this.addMessage(msg);
    this.network.send('quick-comm', { commId, msg });
  }

  sendSystemMessage(content: string): void {
    const msg: ChatMessage = {
      id: this.generateId(),
      senderId: 'system',
      senderName: 'System',
      content,
      type: 'system',
      timestamp: Date.now(),
    };

    this.addMessage(msg);
  }

  private handleChatMessage(networkMsg: NetworkMessage): void {
    const msg = networkMsg.payload as ChatMessage;
    this.addMessage(msg);
  }

  private handleQuickComm(networkMsg: NetworkMessage): void {
    const { commId, msg } = networkMsg.payload;
    this.addMessage(msg);
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);

    // Trim old messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    // Notify listener
    if (this.onMessage) {
      this.onMessage(msg);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getRecentMessages(count: number = 10): ChatMessage[] {
    return this.messages.slice(-count);
  }

  setMessageHandler(handler: (msg: ChatMessage) => void): void {
    this.onMessage = handler;
  }

  clear(): void {
    this.messages = [];
  }

  private generateId(): string {
    return 'msg-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

// ========================================
// Chat UI
// ========================================

export class ChatUI {
  private container: HTMLDivElement;
  private chat: TextChat;
  private messagesEl: HTMLDivElement;
  private inputEl: HTMLInputElement;
  private quickCommEl: HTMLDivElement;

  private isExpanded: boolean = false;
  private isInputFocused: boolean = false;

  constructor(chat: TextChat) {
    this.chat = chat;
    this.container = this.createUI();
    this.setupEventListeners();

    // Listen for new messages
    this.chat.setMessageHandler(this.handleNewMessage.bind(this));
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'chat-container';
    container.innerHTML = `
      <div class="chat-wrapper collapsed">
        <div class="chat-header">
          <span class="chat-title">CHAT</span>
          <div class="chat-controls">
            <button class="chat-toggle" title="Toggle chat">▼</button>
          </div>
        </div>
        <div class="chat-messages"></div>
        <div class="chat-quick-comms">
          ${QUICK_COMMS.map(comm => `
            <button class="quick-comm" data-comm="${comm.id}" title="${comm.label} [${comm.key}]">
              <span class="comm-icon">${comm.icon}</span>
            </button>
          `).join('')}
        </div>
        <div class="chat-input-wrapper">
          <input type="text" class="chat-input" placeholder="Press Enter to chat..." maxlength="200">
          <button class="chat-send">↑</button>
        </div>
      </div>
    `;

    this.applyStyles();
    return container;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .chat-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        font-family: 'Inter', sans-serif;
        z-index: 900;
      }

      .chat-wrapper {
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .chat-wrapper.collapsed .chat-messages,
      .chat-wrapper.collapsed .chat-quick-comms {
        display: none;
      }

      .chat-wrapper.collapsed {
        width: 100px;
      }

      .chat-wrapper.collapsed .chat-input-wrapper {
        display: none;
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
      }

      .chat-title {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 2px;
        color: rgba(255, 255, 255, 0.6);
      }

      .chat-toggle {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 10px;
        transition: transform 0.3s;
      }

      .chat-wrapper:not(.collapsed) .chat-toggle {
        transform: rotate(180deg);
      }

      .chat-messages {
        height: 200px;
        overflow-y: auto;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .chat-messages::-webkit-scrollbar {
        width: 4px;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }

      .chat-message {
        font-size: 13px;
        line-height: 1.4;
        animation: fadeIn 0.2s ease;
      }

      .chat-message.system {
        color: rgba(255, 255, 255, 0.4);
        font-style: italic;
        font-size: 12px;
      }

      .chat-message.quickcomm {
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-block;
      }

      .message-sender {
        color: #667eea;
        font-weight: 500;
        margin-right: 6px;
      }

      .message-content {
        color: rgba(255, 255, 255, 0.9);
      }

      .chat-quick-comms {
        display: flex;
        gap: 4px;
        padding: 8px 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        overflow-x: auto;
      }

      .quick-comm {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .quick-comm:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.1);
      }

      .quick-comm:active {
        transform: scale(0.95);
      }

      .comm-icon {
        font-size: 16px;
      }

      .chat-input-wrapper {
        display: flex;
        gap: 8px;
        padding: 10px 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .chat-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px 12px;
        color: white;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
      }

      .chat-input:focus {
        border-color: rgba(102, 126, 234, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }

      .chat-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      .chat-send {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: #667eea;
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }

      .chat-send:hover {
        background: #5a6fd6;
      }

      .chat-send:active {
        transform: scale(0.95);
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* New message indicator when collapsed */
      .chat-wrapper.collapsed.has-new::before {
        content: '';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: #667eea;
        border-radius: 50%;
        animation: pulse 1s ease infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    const wrapper = this.container.querySelector('.chat-wrapper') as HTMLDivElement;
    const header = this.container.querySelector('.chat-header');
    const input = this.container.querySelector('.chat-input') as HTMLInputElement;
    const sendBtn = this.container.querySelector('.chat-send');
    const quickComms = this.container.querySelectorAll('.quick-comm');

    this.messagesEl = this.container.querySelector('.chat-messages') as HTMLDivElement;
    this.inputEl = input;
    this.quickCommEl = this.container.querySelector('.chat-quick-comms') as HTMLDivElement;

    // Toggle expand/collapse
    header?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      wrapper.classList.toggle('collapsed', !this.isExpanded);
      wrapper.classList.remove('has-new');
    });

    // Send message
    const sendMessage = () => {
      if (this.inputEl.value.trim()) {
        this.chat.send(this.inputEl.value);
        this.inputEl.value = '';
      }
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
      if (e.key === 'Escape') {
        this.inputEl.blur();
      }
    });

    // Track input focus
    input?.addEventListener('focus', () => { this.isInputFocused = true; });
    input?.addEventListener('blur', () => { this.isInputFocused = false; });

    // Quick comms
    quickComms.forEach(btn => {
      btn.addEventListener('click', () => {
        const commId = (btn as HTMLElement).dataset.comm;
        if (commId) {
          this.chat.sendQuickComm(commId);
        }
      });
    });

    // Keyboard shortcuts for quick comms
    window.addEventListener('keydown', (e) => {
      if (this.isInputFocused) return;

      const comm = QUICK_COMMS.find(c => c.key === e.key);
      if (comm) {
        this.chat.sendQuickComm(comm.id);
      }

      // Open chat with Enter
      if (e.key === 'Enter' && !this.isExpanded) {
        this.isExpanded = true;
        const wrapper = this.container.querySelector('.chat-wrapper');
        wrapper?.classList.remove('collapsed');
        setTimeout(() => this.inputEl.focus(), 100);
      }
    });
  }

  private handleNewMessage(msg: ChatMessage): void {
    this.renderMessage(msg);
    this.scrollToBottom();

    // Show indicator if collapsed
    if (!this.isExpanded) {
      const wrapper = this.container.querySelector('.chat-wrapper');
      wrapper?.classList.add('has-new');
    }
  }

  private renderMessage(msg: ChatMessage): void {
    const el = document.createElement('div');
    el.className = `chat-message ${msg.type}`;

    if (msg.type === 'system') {
      el.textContent = msg.content;
    } else {
      el.innerHTML = `
        <span class="message-sender">${this.escapeHtml(msg.senderName)}:</span>
        <span class="message-content">${this.escapeHtml(msg.content)}</span>
      `;
    }

    this.messagesEl.appendChild(el);
  }

  private scrollToBottom(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  expand(): void {
    this.isExpanded = true;
    const wrapper = this.container.querySelector('.chat-wrapper');
    wrapper?.classList.remove('collapsed');
  }

  collapse(): void {
    this.isExpanded = false;
    const wrapper = this.container.querySelector('.chat-wrapper');
    wrapper?.classList.add('collapsed');
  }

  focus(): void {
    this.expand();
    setTimeout(() => this.inputEl.focus(), 100);
  }
}
