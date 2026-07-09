import React from 'react';

jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-class', variable: 'inter-variable' }),
}));
jest.mock('@/app/ClientLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/app/register-pwa', () => ({
  __esModule: true,
  default: () => null,
}));

import RootLayout from '@/app/layout';

describe('RootLayout typography', () => {
  it('exposes the Inter variable and shared font utility on the body', () => {
    const layout = RootLayout({ children: <div>Content</div> });
    const children = React.Children.toArray(layout.props.children) as React.ReactElement[];
    const body = children.find((child) => child.type === 'body');

    expect(body).toBeDefined();
    expect(body?.props.className).toContain('inter-variable');
    expect(body?.props.className).toContain('font-sans');
  });
});
