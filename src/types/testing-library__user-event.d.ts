declare module "@testing-library/user-event" {
  // Minimal shape used by the tests in this repo
  type SetupOptions = {
    document?: Document;
    pointerHover?: boolean;
    advanceTimers?: (ms: number) => void;
    [key: string]: any;
  };

  type UserEvent = {
    setup: (options?: SetupOptions) => any;
    // Some tests may call setup() directly via named import
  };

  const userEvent: UserEvent;

  export default userEvent;
  export function setup(options?: SetupOptions): any;
}
