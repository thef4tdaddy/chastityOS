import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../components/Header';

describe('Header', () => {
  it('renders the header with the correct title', () => {
    render(<Header />);
    const titleElement = screen.getByText(/ChastityOS/i);
    expect(titleElement).toBeInTheDocument();
  });
});
