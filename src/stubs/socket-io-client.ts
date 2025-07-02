// Stub for socket.io-client
export function io(url?: string, options?: any) {
  return {
    on: (event: string, callback: Function) => {},
    off: (event: string, callback?: Function) => {},
    emit: (event: string, ...args: any[]) => {},
    connect: () => {},
    disconnect: () => {},
    connected: false,
    id: 'stub-socket-id'
  };
}

export default io;
