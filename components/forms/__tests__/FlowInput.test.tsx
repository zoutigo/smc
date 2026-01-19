/**
 * @jest-environment jsdom
 */

// Mock Prisma enum to avoid loading client (TextEncoder dependency)
jest.mock("@prisma/client", () => ({
  FlowStation: {
    INJECTION: "INJECTION",
    PAINT: "PAINT",
    ASSEMBLY: "ASSEMBLY",
    BONDING: "BONDING",
    INSPECTION: "INSPECTION",
    SILS: "SILS",
    CUSTOMER: "CUSTOMER",
    WAREHOUSE: "WAREHOUSE",
  },
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FlowInput } from "@/components/forms/FlowInput";

describe("FlowInput", () => {
  const baseProps = {
    value: "",
    onChange: jest.fn(),
    flows: [
      { id: "f1", from: "PAINT", to: "ASSEMBLY", slug: "paint-assembly" },
      { id: "f2", from: "INJECTION", to: "PAINT", slug: "injection-paint" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      json: async () => ({ ok: true, flow: { id: "f3", from: "BONDING", to: "WAREHOUSE", slug: "bonding-warehouse" } }),
    })) as unknown as typeof fetch;
  });

  it("selects an existing flow and toggles inline form", () => {
    const onChange = jest.fn();
    render(<FlowInput {...baseProps} onChange={onChange} />);

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "f2" } });
    expect(onChange).toHaveBeenCalledWith("f2");

    const toggle = screen.getByRole("checkbox", { name: /not in the list/i });
    fireEvent.click(toggle);

    expect(screen.getAllByRole("combobox")).toHaveLength(3); // main select + from/to
  });

  it("creates a flow via inline form and updates list", async () => {
    const onChange = jest.fn();
    const onCreated = jest.fn();

    render(<FlowInput {...baseProps} onChange={onChange} onCreated={onCreated} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "BONDING" } });
    fireEvent.change(selects[2], { target: { value: "WAREHOUSE" } });

    const addButton = screen.getByRole("button", { name: /add flow/i });
    expect(addButton).toBeEnabled();
    fireEvent.click(addButton);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("f3"));
    expect(onChange).toHaveBeenCalledWith("f3");
    expect(onCreated).toHaveBeenCalledWith({ id: "f3", from: "BONDING", to: "WAREHOUSE", slug: "bonding-warehouse" });
    expect(screen.getByRole("option", { name: /bonding → warehouse/i })).toBeInTheDocument();
  });

  it("shows inline validation errors and keeps form open", async () => {
    const onChange = jest.fn();
    render(<FlowInput {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "" } });
    fireEvent.change(selects[2], { target: { value: "" } });

    const addButton = screen.getByRole("button", { name: /add flow/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/invalid flow|invalid from/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows server error returned by createFlowQuickAction", async () => {
    const onChange = jest.fn();
    global.fetch = jest.fn(async () => ({ json: async () => ({ ok: false, error: "duplicate" }) })) as unknown as typeof fetch;

    render(<FlowInput {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "SILS" } });
    fireEvent.change(selects[2], { target: { value: "CUSTOMER" } });

    fireEvent.click(screen.getByRole("button", { name: /add flow/i }));

    await waitFor(() => {
      expect(screen.getByText("duplicate")).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not submit parent form when adding inline flow", async () => {
    const onChange = jest.fn();
    const submitSpy = jest.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={submitSpy}>
        <FlowInput {...baseProps} onChange={onChange} />
      </form>
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "BONDING" } });
    fireEvent.change(selects[2], { target: { value: "WAREHOUSE" } });

    fireEvent.click(screen.getByRole("button", { name: /add flow/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("f3"));
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
