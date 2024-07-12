declare global {
  interface Window {
    api: {
      testInvoke: (args: string) => Promise<string>;
      testSend: (args: string) => void;
    };
  }
}
