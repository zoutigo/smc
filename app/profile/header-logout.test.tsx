import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { signOut, useSession } from 'next-auth/react';

// Mock de next-auth/react
jest.mock('next-auth/react');

// Mock de next/navigation (si utilisé dans le header)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
}));

describe('Header Logout Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs out the user and redirects to /auth/login when logout is clicked', async () => {
    // Simulation d'un utilisateur connecté
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<Header />);

    // 1. Ouvrir le menu utilisateur
    const menuTrigger = screen.getByLabelText(/account menu/i);
    fireEvent.click(menuTrigger);

    // 2. Cliquer sur le bouton Logout
    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);

    // 3. Vérifier que signOut est appelé avec la bonne redirection
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/login' });
    });
  });
});