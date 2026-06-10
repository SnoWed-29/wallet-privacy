import { render, type RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui";

type TestProvidersProps = {
  children: ReactElement;
  route?: string;
};

function TestProviders({ children, route = "/" }: TestProvidersProps) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>{children}</ToastProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { route?: string } = {},
) {
  const { route, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route}>{children as ReactElement}</TestProviders>
    ),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
