/**
 * Debug Logger
 * Shows visible debug info on screen for troubleshooting
 */

class DebugLogger {
    constructor() {
        this.logs = [];
        this.debugElement = null;
        this.init();
    }

    init() {
        this.debugElement = document.getElementById('debugContent');
        this.log('✓ Debug logger initialized', 'success');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            time: timestamp,
            message: message,
            type: type
        };

        this.logs.push(logEntry);

        // Keep only last 15 logs
        if (this.logs.length > 15) {
            this.logs.shift();
        }

        this.render();

        // Also log to console
        const icon = {
            'success': '✓',
            'error': '✗',
            'warn': '⚠',
            'info': '→'
        }[type] || '•';

        console.log(`${icon} ${message}`);
    }

    render() {
        if (!this.debugElement) return;

        const html = this.logs.map(log => {
            const color = {
                'success': '#0f0',
                'error': '#f00',
                'warn': '#ff0',
                'info': '#0ff'
            }[log.type] || '#fff';

            return `<div style="color: ${color}; margin: 2px 0; font-size: 10px;">
                <span style="color: #888">[${log.time}]</span> ${log.message}
            </div>`;
        }).join('');

        this.debugElement.innerHTML = html;
    }

    success(msg) { this.log(msg, 'success'); }
    error(msg) { this.log(msg, 'error'); }
    warn(msg) { this.log(msg, 'warn'); }
    info(msg) { this.log(msg, 'info'); }
}

// Create global debug logger
window.DEBUG = new DebugLogger();
