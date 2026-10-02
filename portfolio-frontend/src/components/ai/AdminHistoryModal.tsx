import { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  X,
  MessageSquare,
  Clock,
  ChevronRight,
  Bot,
  User,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface ConversationSummary {
  conversationId: string;
  messageCount: number;
  firstUserQuery: string;
  lastUserQuery: string;
  lastAssistantReply: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageDetail {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ConversationDetail {
  conversationId: string;
  messages: MessageDetail[];
  createdAt: string;
  updatedAt: string;
}

interface AdminHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'sky_ai_admin_key';

export default function AdminHistoryModal({ isOpen, onClose }: AdminHistoryModalProps) {
  const [adminKey, setAdminKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || '';
  });
  const [keyInput, setKeyInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ConversationDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const getAdminEndpoint = useCallback((): string => {
    const rawEndpoint =
      import.meta.env.VITE_AI_CHAT_ENDPOINT ||
      import.meta.env.VITE_CONTACT_FORM_ENDPOINT ||
      'https://portfolio-5aso.onrender.com/api/ai/chat';

    const base = rawEndpoint.replace(/\/api\/(contact|ai\/chat)\/?$/, '');
    return `${base}/api/ai/admin/conversations`;
  }, []);

  const fetchConversations = useCallback(
    async (keyToUse: string) => {
      if (!keyToUse) return;
      setIsLoadingList(true);
      setAuthError(null);

      try {
        const baseEndpoint = getAdminEndpoint();
        const endpoint = `${baseEndpoint}?key=${encodeURIComponent(keyToUse)}`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'x-admin-key': keyToUse
          }
        });

        if (res.status === 401) {
          setIsAuthenticated(false);
          setAuthError('Invalid admin passcode. Please verify your ADMIN_API_KEY.');
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch conversations (status ${res.status})`);
        }

        const data = await res.json();
        setIsAuthenticated(true);
        setAdminKey(keyToUse);
        localStorage.setItem(STORAGE_KEY, keyToUse);
        setConversations(data.conversations || []);

        // Auto-select first conversation if available and none selected
        if (data.conversations?.length > 0 && !selectedConvId) {
          setSelectedConvId(data.conversations[0].conversationId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error connecting to admin API';
        setAuthError(msg);
      } finally {
        setIsLoadingList(false);
      }
    },
    [getAdminEndpoint, selectedConvId]
  );

  const fetchConversationDetail = useCallback(
    async (convId: string, keyToUse: string) => {
      setIsLoadingDetail(true);
      try {
        const baseEndpoint = `${getAdminEndpoint()}/${convId}`;
        const endpoint = `${baseEndpoint}?key=${encodeURIComponent(keyToUse)}`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'x-admin-key': keyToUse
          }
        });

        if (!res.ok) {
          throw new Error('Unable to retrieve conversation transcript.');
        }

        const data = await res.json();
        setSelectedDetail(data.conversation);
      } catch (err) {
        console.error('Error fetching detail:', err);
        toast.error('Could not load conversation details.');
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [getAdminEndpoint]
  );

  // Authenticate with saved key on open
  useEffect(() => {
    if (isOpen && adminKey && !isAuthenticated) {
      void fetchConversations(adminKey);
    }
  }, [isOpen, adminKey, isAuthenticated, fetchConversations]);

  // Load detail when selectedConvId changes
  useEffect(() => {
    if (selectedConvId && adminKey && isAuthenticated) {
      void fetchConversationDetail(selectedConvId, adminKey);
    } else {
      setSelectedDetail(null);
    }
  }, [selectedConvId, adminKey, isAuthenticated, fetchConversationDetail]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    void fetchConversations(keyInput.trim());
  };

  const handleDeleteConversation = async (convId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!adminKey) return;

    setIsDeleting(convId);
    try {
      const baseEndpoint = `${getAdminEndpoint()}/${convId}`;
      const endpoint = `${baseEndpoint}?key=${encodeURIComponent(adminKey)}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
          'x-admin-key': adminKey
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete conversation.');
      }

      toast.success('Conversation deleted successfully.');
      setConversations((prev) => prev.filter((c) => c.conversationId !== convId));

      if (selectedConvId === convId) {
        setSelectedConvId(null);
        setSelectedDetail(null);
      }
    } catch (err) {
      toast.error('Failed to delete conversation.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!adminKey) return;
    if (!window.confirm('Are you sure you want to delete ALL conversation histories? This cannot be undone.')) {
      return;
    }

    try {
      const baseEndpoint = getAdminEndpoint();
      const endpoint = `${baseEndpoint}?key=${encodeURIComponent(adminKey)}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
          'x-admin-key': adminKey
        }
      });

      if (!res.ok) {
        throw new Error('Failed to clear conversations.');
      }

      toast.success('All conversation history cleared.');
      setConversations([]);
      setSelectedConvId(null);
      setSelectedDetail(null);
    } catch {
      toast.error('Failed to clear conversations.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey('');
    setIsAuthenticated(false);
    setConversations([]);
    setSelectedConvId(null);
    setSelectedDetail(null);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      c.conversationId.toLowerCase().includes(query) ||
      c.firstUserQuery.toLowerCase().includes(query) ||
      c.lastUserQuery.toLowerCase().includes(query)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SKY AI Conversation History Manager"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col rounded-2xl border border-zinc-800 bg-[#0c0c12] shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/90 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-mono tracking-wide">
                  SKY AI Conversation History
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Inspect what visitors asked and manage recorded conversations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => fetchConversations(adminKey)}
                  disabled={isLoadingList}
                  title="Refresh Conversations"
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear All Conversations"
                  className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/50 text-rose-300 transition-all text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Lock / Logout"
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Password Authentication Gate */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Admin Passcode Required</h4>
              <p className="text-xs text-zinc-400 mb-6">
                Enter your admin key to inspect and manage user conversations recorded by SKY AI.
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter ADMIN_API_KEY..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 text-sm text-white placeholder-zinc-500 outline-none transition-all font-mono"
                  />
                </div>

                {authError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingList || !keyInput.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-zinc-950 font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isLoadingList ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-zinc-950" />
                      <span>Unlock Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Split View Dashboard */
          <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar: Conversation List */}
            <div className="w-full sm:w-80 md:w-96 flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-800 bg-zinc-950/40">
              {/* Search filter */}
              <div className="p-3 border-b border-zinc-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search queries..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
                {isLoadingList && conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>Loading conversations...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p>No conversations found.</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConvId === conv.conversationId;
                    return (
                      <div
                        key={conv.conversationId}
                        onClick={() => setSelectedConvId(conv.conversationId)}
                        className={`p-3.5 cursor-pointer transition-colors relative group flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-zinc-800/60 border-l-2 border-cyan-400'
                            : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
                            </span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {formatDate(conv.updatedAt)}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-0.5">
                            {conv.firstUserQuery || 'Empty conversation'}
                          </p>
                          {conv.lastUserQuery && conv.lastUserQuery !== conv.firstUserQuery && (
                            <p className="text-[11px] text-zinc-400 line-clamp-1">
                              Latest: {conv.lastUserQuery}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(conv.conversationId, e)}
                            disabled={isDeleting === conv.conversationId}
                            title="Delete this conversation"
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {isDeleting === conv.conversationId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Conversation Transcript */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c12]">
              {selectedConvId && (
                <div className="p-3 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40 text-xs">
                  <div className="font-mono text-zinc-400 truncate max-w-sm">
                    ID: <span className="text-zinc-200 font-semibold">{selectedConvId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(selectedConvId)}
                    disabled={isDeleting === selectedConvId}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/50 text-rose-300 transition-colors text-xs flex items-center gap-1.5"
                  >
                    {isDeleting === selectedConvId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete Conversation</span>
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                {isLoadingDetail ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>Loading transcript...</span>
                  </div>
                ) : !selectedDetail ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <MessageSquare className="w-10 h-10 text-zinc-700 mb-2" />
                    <p className="text-sm font-medium text-zinc-400">Select a conversation</p>
                    <p className="text-xs max-w-xs mt-1">
                      Choose a conversation from the left to view the full dialogue between the visitor and SKY AI.
                    </p>
                  </div>
                ) : selectedDetail.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    No messages recorded in this conversation.
                  </div>
                ) : (
                  selectedDetail.messages.map((m, idx) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                        )}

                        <div className={`max-w-[85%] sm:max-w-[75%] space-y-1`}>
                          <div className={`flex items-center gap-2 text-[10px] text-zinc-500 font-mono ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span>{isUser ? 'Visitor' : 'SKY AI'}</span>
                            <span>·</span>
                            <span>{formatDate(m.timestamp)}</span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed text-xs sm:text-sm ${
                              isUser
                                ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-100 rounded-tr-sm'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                            <User className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
