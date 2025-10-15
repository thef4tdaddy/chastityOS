declare module "@testing-library/user-event" {
  // Minimal shape used by the tests in this repo
  type SetupOptions = {
    document?: Document;
    pointerHover?: boolean;
    advanceTimers?: (ms: number) => void;
    [key: string]: unknown;
  };

  interface UserEventInstance {
    click(element: Element): Promise<void>;
    type(element: Element, text: string): Promise<void>;
    keyboard(text: string): Promise<void>;
  }

  // userEvent.setup()
  export function setup(options?: SetupOptions): UserEventInstance;

  const userEvent: {
    setup: typeof setup;
  };

  export default userEvent;
}
