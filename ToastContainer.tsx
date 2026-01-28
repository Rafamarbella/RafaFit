
import React, { useState, useEffect } from 'react';
import { ToastMessage } from '../../types';
import { toast } from './toast';

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const removeListener = toast.subscribe((newToast) => {
            setToasts(prev => [...prev, newToast]);
            
            if (newToast.duration) {
                setTimeout(() => {
                    removeToast(newToast.id);
                }, newToast.duration);
            }
        });
        return () => removeListener();
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center pointer-events-none gap-2 px-4">
            {toasts.map(t => (
                <div 
                    key={t.id}
                    onClick={() => removeToast(t.id)}
                    className={`pointer-events-auto shadow-lg rounded-full px-6 py-3 text-sm font-bold text-white transition-all animate-fade-in-down cursor-pointer flex items-center gap-2 ${
                        t.type === 'SUCCESS' ? 'bg-green-600' :
                        t.type === 'ERROR' ? 'bg-red-600' :
                        t.type === 'WARNING' ? 'bg-orange-500' :
                        'bg-gray-800'
                    }`}
                >
                    {t.type === 'SUCCESS' && <span>✓</span>}
                    {t.type === 'ERROR' && <span>✕</span>}
                    {t.type === 'WARNING' && <span>⚠</span>}
                    {t.message}
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
