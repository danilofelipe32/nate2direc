import React, { useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { Task, useTasks, Comment } from '../context/TaskContext';

interface CommentModalProps {
  task: Task;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ task, onClose }) => {
  const { addComment } = useTasks();
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(task.id, newComment);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <MessageSquare size={18} className="text-indigo-500" /> 
            <span className="truncate max-w-[250px]">{task.title}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-full transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {(task.comments || []).length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic bg-slate-50/50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
              Nenhum comentário ainda.
            </div>
          ) : (
            (task.comments || []).map((comment: Comment) => (
              <div key={comment.id} className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.author}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            autoFocus
          />
          <button 
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
