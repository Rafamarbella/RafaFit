
import { ToastMessage, ToastType } from '../types';

type ToastListener = (toast: ToastMessage) => void;

class ToastManager {
    private listeners: ToastListener[] = [];

    public subscribe(listener: ToastListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public show(message: string, type: ToastType = 'INFO', duration = 3000) {
        const toast: ToastMessage = {
            id: crypto.randomUUID(),
            message,
            type,
            duration
        };
        this.listeners.forEach(l => l(toast));
    }

    public success(msg: string) { this.show(msg, 'SUCCESS'); }
    public error(msg: string) { this.show(msg, 'ERROR', 4000); }
    public warning(msg: string) { this.show(msg, 'WARNING', 4000); }
    public info(msg: string) { this.show(msg, 'INFO'); }
}

export const toast = new ToastManager();
