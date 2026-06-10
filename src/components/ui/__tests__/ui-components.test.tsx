import { vi } from "vitest";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppModal,
  AppSelect,
  ToastProvider,
  useToast,
} from "../index";
import {
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  act,
} from "../../../test/test-utils";

function ToastHarness() {
  const toast = useToast();

  return (
    <div>
      <AppButton onClick={() => toast.success("Saved locally", "Success")}>
        Success
      </AppButton>
      <AppButton onClick={() => toast.error("Could not save", "Error")}>
        Error
      </AppButton>
    </div>
  );
}

describe("ui components", () => {
  it("renders AppButton variants as buttons", () => {
    renderWithProviders(
      <div>
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="danger">Danger</AppButton>
        <AppButton variant="ghost">Ghost</AppButton>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Secondary" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Danger" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ghost" })).toBeEnabled();
  });

  it("renders AppCard title, description, actions, and body", () => {
    renderWithProviders(
      <AppCard
        actions={<AppButton>Action</AppButton>}
        description="Card description"
        title="Card title"
      >
        Card body
      </AppCard>,
    );

    expect(screen.getByRole("heading", { name: "Card title" })).toBeVisible();
    expect(screen.getByText("Card description")).toBeVisible();
    expect(screen.getByRole("button", { name: "Action" })).toBeVisible();
    expect(screen.getByText("Card body")).toBeVisible();
  });

  it("renders AppInput validation errors accessibly", () => {
    renderWithProviders(
      <label>
        Amount
        <AppInput aria-label="Amount" error="Amount is required" />
      </label>,
    );

    const input = screen.getByLabelText("Amount");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Amount is required")).toBeVisible();
  });

  it("supports AppSelect user selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <label>
        Type
        <AppSelect defaultValue="expense">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </AppSelect>
      </label>,
    );

    await user.selectOptions(screen.getByLabelText("Type"), "income");

    expect(screen.getByLabelText("Type")).toHaveValue("income");
  });

  it("renders AppBadge variants", () => {
    renderWithProviders(
      <div>
        <AppBadge variant="income">Income</AppBadge>
        <AppBadge variant="expense">Expense</AppBadge>
        <AppBadge variant="success">Success</AppBadge>
        <AppBadge variant="warning">Warning</AppBadge>
      </div>,
    );

    expect(screen.getByText("Income")).toBeVisible();
    expect(screen.getByText("Expense")).toBeVisible();
    expect(screen.getByText("Success")).toBeVisible();
    expect(screen.getByText("Warning")).toBeVisible();
  });

  it("opens and closes AppModal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = renderWithProviders(
      <AppModal onClose={onClose} open title="Confirm">
        Modal content
      </AppModal>,
    );

    expect(screen.getByRole("dialog", { name: "Confirm" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledOnce();

    rerender(
      <AppModal onClose={onClose} open={false} title="Confirm">
        Modal content
      </AppModal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("toast notifications", () => {
  it("shows success and error toasts and dismisses them automatically", async () => {
    vi.useFakeTimers();

    renderWithProviders(<ToastHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Success" }));
    fireEvent.click(screen.getByRole("button", { name: "Error" }));

    expect(screen.getByText("Saved locally")).toBeVisible();
    expect(screen.getByText("Could not save")).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(4_300);
    });

    expect(screen.queryByText("Saved locally")).not.toBeInTheDocument();
    expect(screen.queryByText("Could not save")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
