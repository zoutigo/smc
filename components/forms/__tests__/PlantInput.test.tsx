/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlantInput } from "@/components/forms/PlantInput";

describe("PlantInput", () => {
  const baseProps = {
    value: "",
    onChange: jest.fn(),
    plants: [
      { id: "p1", name: "Plant 1" },
      { id: "p2", name: "Plant 2" },
    ],
    countries: [
      { id: "11111111-1111-4111-8111-111111111111", name: "France" },
      { id: "22222222-2222-4222-8222-222222222222", name: "Canada" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      json: async () => ({ ok: true, plant: { id: "new-plant", name: "New Plant" } }),
    })) as unknown as typeof fetch;
  });

  it("fires input and click events for selecting existing plant and toggling inline form", () => {
    const onChange = jest.fn();
    render(<PlantInput {...baseProps} onChange={onChange} />);

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "p2" } });

    expect(onChange).toHaveBeenCalledWith("p2");

    const toggle = screen.getByRole("checkbox", { name: /not in the list/i });
    fireEvent.click(toggle);

    expect(screen.getByPlaceholderText(/new plant name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/city/i)).toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it("fires input events for inline form and triggers create flow on click", async () => {
    const onChange = jest.fn();

    render(<PlantInput {...baseProps} onChange={onChange} />);

    const toggle = screen.getByRole("checkbox", { name: /not in the list/i });
    fireEvent.click(toggle);

    fireEvent.input(screen.getByPlaceholderText(/new plant name/i), { target: { value: " New Plant " } });
    fireEvent.input(screen.getByPlaceholderText(/city/i), { target: { value: " Lyon " } });

    const countrySelect = screen.getAllByRole("combobox").slice(-1)[0];
    fireEvent.change(countrySelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    const addButton = screen.getByRole("button", { name: /add/i });
    expect(addButton).toBeEnabled();

    fireEvent.click(addButton);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new-plant"));
    expect(screen.queryByPlaceholderText(/new plant name/i)).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "New Plant" })).toBeInTheDocument();
  });

  it("shows error when createPlantQuickAction returns an error result", async () => {
    const onChange = jest.fn();
    global.fetch = jest.fn(async () => ({ json: async () => ({ ok: false, error: "No country" }) })) as unknown as typeof fetch;

    render(<PlantInput {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    fireEvent.input(screen.getByPlaceholderText(/new plant name/i), { target: { value: " New Plant " } });
    fireEvent.input(screen.getByPlaceholderText(/city/i), { target: { value: " Lyon " } });
    const countrySelect = screen.getAllByRole("combobox").slice(-1)[0];
    fireEvent.change(countrySelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText("No country")).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/new plant name/i)).toBeInTheDocument();
  });

  it("shows error when createPlantQuickAction rejects", async () => {
    const onChange = jest.fn();
    global.fetch = jest.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;

    render(<PlantInput {...baseProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    fireEvent.input(screen.getByPlaceholderText(/new plant name/i), { target: { value: " New Plant " } });
    fireEvent.input(screen.getByPlaceholderText(/city/i), { target: { value: " Lyon " } });
    const countrySelect = screen.getAllByRole("combobox").slice(-1)[0];
    fireEvent.change(countrySelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/new plant name/i)).toBeInTheDocument();
  });

  it("does not submit parent form when adding inline", async () => {
    const onChange = jest.fn();
    const submitSpy = jest.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={submitSpy}>
        <PlantInput {...baseProps} onChange={onChange} />
      </form>
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    fireEvent.input(screen.getByPlaceholderText(/new plant name/i), { target: { value: " New Plant " } });
    fireEvent.input(screen.getByPlaceholderText(/city/i), { target: { value: " Lyon " } });
    const countrySelect = screen.getAllByRole("combobox").slice(-1)[0];
    fireEvent.change(countrySelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("new-plant"));
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
