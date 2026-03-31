export class WorkerTicker {
  private worker: Worker;
  private readonly listener: (event: MessageEvent<number>) => void;

  constructor(onTick: (timestamp: number) => void) {
    const code = `
      let timer = null;
      self.onmessage = (event) => {
        if (event.data === 'start') {
          if (timer !== null) return;
          timer = setInterval(() => {
            self.postMessage(performance.now());
          }, 16);
          return;
        }

        if (event.data === 'stop') {
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        }
      };
    `;

    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    this.worker = new Worker(url);
    URL.revokeObjectURL(url);

    this.listener = (event: MessageEvent<number>) => {
      onTick(event.data);
    };

    this.worker.addEventListener('message', this.listener);
  }

  start() {
    this.worker.postMessage('start');
  }

  stop() {
    this.worker.postMessage('stop');
  }

  dispose() {
    this.worker.removeEventListener('message', this.listener);
    this.worker.terminate();
  }
}
