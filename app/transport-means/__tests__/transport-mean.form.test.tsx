/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransportMeanForm } from "@/app/transport-means/_registry/transport-mean.form";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: jest.fn() }),
}));

describe("TransportMeanForm", () => {
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

  it("soumet avec valeurs de base", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "success" });
    render(
      <TransportMeanForm
        mode="create"
        categoryId="aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa"
        categoryName="AGV-AMR"
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        redirectTo="/transport-means/agv"
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /start/i }));
    await userEvent.type(screen.getByLabelText(/name/i), "AMR Test");
    await userEvent.type(screen.getByLabelText(/description/i), "desc");
    const comboBoxes = screen.getAllByRole("combobox");
    fireEvent.change(comboBoxes[0], { target: { value: suppliers[0].id } });
    fireEvent.change(comboBoxes[1], { target: { value: plants[1].id } });
    fireEvent.change(comboBoxes[2], { target: { value: flows[0].id } });
    fireEvent.change(screen.getByLabelText(/units/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/load capacity/i), { target: { value: "900" } });
    fireEvent.change(screen.getByLabelText(/cruise speed/i), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText(/max speed/i), { target: { value: "9" } });

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("affiche les erreurs de validation", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "error", fieldErrors: { name: "Required" } });
    render(
      <TransportMeanForm
        mode="create"
        categoryId="bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb"
        categoryName="AGV-AMR"
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        redirectTo="/transport-means/agv"
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /start/i }));
    await userEvent.type(screen.getByLabelText(/name/i), "A");
    expect(await screen.findByText(/2 character/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
