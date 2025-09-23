import React from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './services/queryClient';

function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>Welcome to the ChastityOS Rewrite</h1>
        <p>The application is being rebuilt on a new TypeScript foundation.</p>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
