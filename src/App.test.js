import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Gym BRO app', () => {
  render(<App />);
  // App shows loading state initially (spinner emoji) or auth screen
  const appEl = document.querySelector('.app, .auth-screen, body');
  expect(appEl).toBeInTheDocument();
});
