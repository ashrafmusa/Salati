import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { ActivityLogEntry, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { SpinnerIcon } from '../assets/icons';
import { PaperAirplaneIcon } from '../assets/adminIcons';
import { addOrderLog } from '../utils/orderLogger';

interface OrderActivityLogProps {
  orderId: string;
  userRole: 'admin' | 'customer';
}

const LogEntry: React.FC<{ log: ActivityLogEntry, currentUser: User | null }> = ({ log, currentUser }) => {
    const isCurrentUser = log.authorId === currentUser?.uid;
    const authorName = isCurrentUser ? 'أنت' : log.authorName;

    const getEntryStyles = () => {
        switch(log.type) {
            case 'customer_message': return { bg: isCurrentUser ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700', align: isCurrentUser ? 'self-end' : 'self-start', text: isCurrentUser ? 'text-right' : 'text-left' };
            case 'admin_message': return { bg: isCurrentUser ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-700', align: isCurrentUser ? 'self-end' : 'self-start', text: isCurrentUser ? 'text-right' : 'text-left' };
            case 'driver_note':
            case 'issue': return { bg: 'bg-amber-50 dark:bg-amber-900/50', align: 'self-start', text: 'text-right' };
            case 'internal_note': return { bg: 'bg-purple-50 dark:bg-purple-900/50', align: 'self-start', text: 'text-right' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-700/50', align: 'self-center', text: 'text-center' };
        }
    }
    
    const { bg, align, text } = getEntryStyles();
    
    if (log.type === 'system_log' || log.type === 'status_change') {
        return (
            <div className={`text-xs text-slate-500 dark:text-slate-400 py-1 ${align} ${text}`}>
                <span>{log.message}</span> • <span className="whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
        )
    }

    return (
        <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${bg} ${align} ${text}`}>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{authorName}</p>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{log.message}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
        </div>
    )
}

const OrderActivityLog: React.FC<OrderActivityLogProps> = ({ orderId, userRole }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageType, setMessageType] = useState<'public' | 'internal'>('public');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logQuery = db.collection('orders').doc(orderId).collection('activityLog').orderBy('timestamp', 'asc');
    const unsubscribe = logQuery.onSnapshot(snapshot => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
      setLogs(fetchedLogs);
      setLoading(false);
    }, err => {
      console.error("Error fetching activity log:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setIsSending(true);

    if (userRole === 'admin') {
        const type = messageType === 'public' ? 'admin_message' : 'internal_note';
        await addOrderLog(orderId, user, newMessage, type, messageType);
    } else { // customer
        await addOrderLog(orderId, user, newMessage, 'customer_message', 'public', {
            message: `رسالة جديدة بخصوص الطلب #${orderId.slice(0, 7)}`,
            link: `/orders?view=${orderId}`
        });
    }

    setNewMessage('');
    setIsSending(false);
  };

  const publicLogs = logs.filter(log => log.visibility === 'public');
  const internalLogs = userRole === 'admin' ? logs.filter(log => log.visibility === 'internal') : [];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {loading && <SpinnerIcon className="w-6 h-6 mx-auto animate-spin" />}
        
        {userRole === 'admin' && internalLogs.length > 0 && (
            <>
                <div className="text-center text-xs font-bold uppercase text-slate-400">--- السجل الداخلي وملاحظات السائق ---</div>
                <div className="flex flex-col gap-2">
                    {internalLogs.map(log => <LogEntry key={log.id} log={log} currentUser={user} />)}
                </div>
                <div className="text-center text-xs font-bold uppercase text-slate-400">--- المحادثة مع العميل ---</div>
            </>
        )}
        
        <div className="flex flex-col gap-2">
            {publicLogs.map(log => <LogEntry key={log.id} log={log} currentUser={user} />)}
        </div>

        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-start gap-2">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={userRole === 'admin' && messageType === 'internal' ? 'أضف ملاحظة داخلية...' : 'اكتب رسالتك...'}
            rows={2}
            className="flex-grow p-2 border rounded-md bg-white dark:bg-slate-700"
          />
          <button onClick={handleSendMessage} disabled={isSending} className="p-3 bg-primary text-white rounded-md disabled:bg-slate-400">
            {isSending ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5" />}
          </button>
        </div>
        {userRole === 'admin' && (
            <div className="flex items-center justify-end gap-4 mt-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="messageType" value="public" checked={messageType === 'public'} onChange={() => setMessageType('public')} />
                    رسالة للعميل (عام)
                </label>
                 <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="messageType" value="internal" checked={messageType === 'internal'} onChange={() => setMessageType('internal')} />
                    ملاحظة داخلية
                </label>
            </div>
        )}
      </div>
    </div>
  );
};

export default OrderActivityLog;