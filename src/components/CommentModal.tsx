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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare size={18} /> Comentários: {task.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {(task.comments || []).map((comment: Comment) => (
            <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold">{comment.author}</span>
                <span>{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar comentário..."
            className="flex-1 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button 
            onClick={handleAddComment}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
