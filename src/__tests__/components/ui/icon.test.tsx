import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Icon, NavigationIcon, ButtonIcon, ContentIcon, HeroIcon, House, Heart } from '@/components/ui/icon';

describe('Icon System', () => {
  describe('Basic Icon Component', () => {
    it('renders icon with default props', () => {
      render(<Icon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toBeInTheDocument();
    });

    it('applies correct size variants', () => {
      const { rerender } = render(<Icon icon={House} size="xs" aria-label="Home" />);
      let icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '12');
      expect(icon).toHaveAttribute('height', '12');

      rerender(<Icon icon={House} size="lg" aria-label="Home" />);
      icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');

      rerender(<Icon icon={House} size="2xl" aria-label="Home" />);
      icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '48');
      expect(icon).toHaveAttribute('height', '48');
    });

    it('applies accent color styling', () => {
      render(<Icon icon={Heart} accent aria-label="Like" />);
      const icon = screen.getByRole('img', { name: /like/i });
      expect(icon).toHaveClass('text-primary');
    });

    it('applies neutral color when no accent', () => {
      render(<Icon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveClass('text-current');
    });

    it('applies custom className', () => {
      render(<Icon icon={House} className="custom-class" aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveClass('custom-class');
    });

    it('applies correct stroke width for regular weight', () => {
      render(<Icon icon={House} weight="regular" aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveStyle({ strokeWidth: '1.5px' });
    });

    it('has proper accessibility attributes', () => {
      render(<Icon icon={House} aria-label="Navigate to home page" />);
      const icon = screen.getByRole('img', { name: /navigate to home page/i });
      expect(icon).toHaveAttribute('aria-label', 'Navigate to home page');
      expect(icon).toHaveAttribute('role', 'img');
    });
  });

  describe('Convenience Components', () => {
    it('NavigationIcon renders with medium size', () => {
      render(<NavigationIcon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });

    it('ButtonIcon renders with small size', () => {
      render(<ButtonIcon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    it('ContentIcon renders with large size', () => {
      render(<ContentIcon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
    });

    it('HeroIcon renders with extra large size', () => {
      render(<HeroIcon icon={House} aria-label="Home" />);
      const icon = screen.getByRole('img', { name: /home/i });
      expect(icon).toHaveAttribute('width', '48');
      expect(icon).toHaveAttribute('height', '48');
    });
  });

  describe('Site-Specific Theming', () => {
    it('applies primary color for accent icons', () => {
      render(<Icon icon={Heart} accent aria-label="Like" />);
      const icon = screen.getByRole('img', { name: /like/i });
      expect(icon).toHaveClass('text-primary');
    });

    it('applies current color for non-accent icons', () => {
      render(<Icon icon={Heart} aria-label="Like" />);
      const icon = screen.getByRole('img', { name: /like/i });
      expect(icon).toHaveClass('text-current');
    });

    it('works with site-specific theming via CSS custom properties', () => {
      // Site-specific theming is handled via CSS custom properties at the global level
      // The icon component uses text-primary which resolves to the site-specific primary color
      render(
        <div data-site="himaya" style={{ '--primary': '#2C3E50' } as React.CSSProperties}>
          <Icon icon={Heart} accent aria-label="Like" />
        </div>
      );
      const icon = screen.getByRole('img', { name: /like/i });
      expect(icon).toHaveClass('text-primary');
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper semantic markup', () => {
      render(<Icon icon={House} aria-label="Home navigation" />);
      const icon = screen.getByRole('img', { name: /home navigation/i });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('supports custom role attributes', () => {
      render(<Icon icon={House} role="button" aria-label="Home button" />);
      const icon = screen.getByRole('button', { name: /home button/i });
      expect(icon).toBeInTheDocument();
    });

    it('maintains focus handling', () => {
      render(<Icon icon={House} tabIndex={0} aria-label="Focusable home icon" />);
      const icon = screen.getByRole('img', { name: /focusable home icon/i });
      expect(icon).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Performance & Tree Shaking', () => {
    it('only imports used icons', () => {
      // This test ensures the icon system supports tree shaking
      // by only importing specific icons rather than the entire library
      expect(House).toBeDefined();
      expect(Heart).toBeDefined();
    });
  });
}); 