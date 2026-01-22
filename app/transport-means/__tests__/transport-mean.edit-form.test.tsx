/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransportMeanForm } from "@/app/transport-means/_registry/transport-mean.form";

const mockShow = jest.fn();
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: mockShow }),
}));

describe("TransportMeanForm edit flow", () => {
  const suppliers = [
    { id: "11111111-2222-4aaa-8aaa-aaaaaaaaaaaa", name: "Supplier A" },
    { id: "22222222-3333-4bbb-8bbb-bbbbbbbbbbbb", name: "Supplier B" },
  ];
  const plants = [
    { id: "33333333-4444-4ccc-8ccc-cccccccccccc", name: "Plant A" },
    { id: "44444444-5555-4ddd-8ddd-dddddddddddd", name: "Plant B" },
  ];
  const flows = [
    { id: "77777777-8888-4aaa-8aaa-aaaaaaaaaaaa", from: "INJECTION", to: "PAINT", slug: "injection-paint" },
    { id: "88888888-9999-4bbb-8bbb-bbbbbbbbbbbb", from: "PAINT", to: "ASSEMBLY", slug: "paint-assembly" },
  ];
  const countries = [{ id: "country-1", name: "France" }];
  const packagingMeans = [
    { id: "55555555-6666-4eee-8eee-eeeeeeeeeeee", name: "Picking Cart 01" },
    { id: "66666666-7777-4fff-8fff-ffffffffffff", name: "Utility Cart 02" },
  ];
  const transport = {
    id: "transport-1",
    name: "AGV 01",
    description: "demo",
    supplierId: suppliers[0].id,
    plantId: plants[0].id,
    units: 2,
    loadCapacityKg: 200,
    cruiseSpeedKmh: 5,
    maxSpeedKmh: 7,
    sop: "2026-01-02",
    eop: "2026-01-11",
    packagingLinks: [{ packagingMeanId: packagingMeans[0].id, maxQty: 2 }],
    flows: [{ flowId: flows[0].id }],
  };

  beforeEach(() => {
    mockShow.mockReset();
  });

  it("walks through steps and submits on summary", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "success" });
    const { container } = render(
      <TransportMeanForm
        mode="edit"
        categoryId="aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa"
        categoryName="AGV-AMR"
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        transport={transport}
        redirectTo="/transport-means/agv"
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    await userEvent.clear(screen.getByLabelText(/name/i));
    await userEvent.type(screen.getByLabelText(/name/i), "AGV 01 Updated");
    await userEvent.clear(screen.getByLabelText(/units/i));
    await userEvent.type(screen.getByLabelText(/units/i), "2");
    await userEvent.clear(screen.getByLabelText(/load capacity/i));
    await userEvent.type(screen.getByLabelText(/load capacity/i), "200");
    await userEvent.clear(screen.getByLabelText(/cruise speed/i));
    await userEvent.type(screen.getByLabelText(/cruise speed/i), "5");
    await userEvent.clear(screen.getByLabelText(/max speed/i));
    await userEvent.type(screen.getByLabelText(/max speed/i), "7");
    const comboBoxes = screen.getAllByRole("combobox");
    await userEvent.selectOptions(comboBoxes[0], suppliers[0].id);
    await userEvent.selectOptions(comboBoxes[1], plants[0].id);
    await userEvent.selectOptions(comboBoxes[2], flows[0].id);

    await waitFor(() => expect(screen.getByRole("button", { name: /next/i })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Summary", { selector: "p" });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(mockShow).toHaveBeenCalledWith("Transport mean saved", "success");
  });

  it("shows zod validation errors on basics step", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "success" });
    render(
      <TransportMeanForm
        mode="edit"
        categoryId="aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa"
        categoryName="AGV-AMR"
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        transport={{ ...transport, name: "" }}
        redirectTo="/transport-means/agv"
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "A" } });

    expect(await screen.findByText(/2 character/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows API field errors after submit", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "error", fieldErrors: { name: "Required" } });
    render(
      <TransportMeanForm
        mode="edit"
        categoryId="aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa"
        categoryName="AGV-AMR"
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        transport={transport}
        redirectTo="/transport-means/agv"
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    await userEvent.clear(screen.getByLabelText(/name/i));
    await userEvent.type(screen.getByLabelText(/name/i), "AGV 01 Updated");
    await userEvent.clear(screen.getByLabelText(/units/i));
    await userEvent.type(screen.getByLabelText(/units/i), "2");
    await userEvent.clear(screen.getByLabelText(/load capacity/i));
    await userEvent.type(screen.getByLabelText(/load capacity/i), "200");
    await userEvent.clear(screen.getByLabelText(/cruise speed/i));
    await userEvent.type(screen.getByLabelText(/cruise speed/i), "5");
    await userEvent.clear(screen.getByLabelText(/max speed/i));
    await userEvent.type(screen.getByLabelText(/max speed/i), "7");
    const comboBoxes = screen.getAllByRole("combobox");
    await userEvent.selectOptions(comboBoxes[0], suppliers[0].id);
    await userEvent.selectOptions(comboBoxes[1], plants[0].id);
    await userEvent.selectOptions(comboBoxes[2], flows[0].id);

    await waitFor(() => expect(screen.getByRole("button", { name: /next/i })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Summary", { selector: "p" });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });
});
