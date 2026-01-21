/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FlowStation } from "@prisma/client";
import type { Flow, PackagingMeanCategory, Plant, Supplier } from "@prisma/client";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import PackagingMeanForm from "../packaging-mean.form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const category: PackagingMeanCategory = {
  id: "00000000-0000-4000-8000-000000000000",
  name: "Utility Cart",
  slug: "utility-cart",
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const plants: Plant[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Plant A",
    addressId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const flows: Flow[] = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "flow-a",
    from: FlowStation.INJECTION,
    to: FlowStation.PAINT,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const suppliers: Supplier[] = [
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Supplier A",
    addressId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
const countries = [{ id: "00000000-0000-4000-8000-000000000004", name: "France" }];
const accessories = [{ id: "00000000-0000-4000-8000-000000000005", name: "Cover" }];
const projects = [{ id: "00000000-0000-4000-8000-000000000006", name: "Project A" }];
const partFamilies = [{ id: "00000000-0000-4000-8000-000000000007", name: "Family A" }];

describe("PackagingMeanForm", () => {
  it("empêche de passer à l'étape suivante tant que les champs obligatoires sont invalides", async () => {
    render(
      <ConfirmProvider>
        <PackagingMeanForm
          mode="create"
          category={category}
          plants={plants}
          flows={flows}
          suppliers={suppliers}
          countries={countries}
          accessories={accessories}
          projects={projects}
          partFamilies={partFamilies}
          onSubmit={jest.fn()}
        />
      </ConfirmProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    const nextBtn = screen.getByRole("button", { name: /^Next$/i });
    expect(nextBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/storage mean name/i), { target: { value: "Trolley X" } });
    fireEvent.change(screen.getByPlaceholderText(/what makes this storage mean unique/i), { target: { value: "Desc" } });
    fireEvent.change(screen.getByPlaceholderText(/^0$/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Length/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Width/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText(/Total packagings/i), { target: { value: "5" } });
    const plantSelect = screen.getByText(/Select a plant/i).closest("select") as HTMLSelectElement;
    fireEvent.change(plantSelect, { target: { value: plants[0].id } });

    await waitFor(() => expect(nextBtn).not.toBeDisabled());
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => expect(screen.getByText(/Add part/i)).toBeInTheDocument());
  });

  it("collecte accessories et parts dans le FormData au submit", async () => {
    const onSubmit = jest.fn().mockResolvedValue({ status: "success" });

    render(
      <ConfirmProvider>
        <PackagingMeanForm
          mode="create"
          category={category}
          plants={plants}
          flows={flows}
          suppliers={suppliers}
          countries={countries}
          accessories={accessories}
          projects={projects}
          partFamilies={partFamilies}
          onSubmit={onSubmit}
        />
      </ConfirmProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    fireEvent.change(screen.getByPlaceholderText(/storage mean name/i), { target: { value: "Trolley X" } });
    fireEvent.change(screen.getByPlaceholderText(/what makes this storage mean unique/i), { target: { value: "Desc" } });
    fireEvent.change(screen.getByPlaceholderText(/^0$/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Length/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Width/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText(/Total packagings/i), { target: { value: "5" } });
    const plantSelect = screen.getByText(/Select a plant/i).closest("select") as HTMLSelectElement;
    fireEvent.change(plantSelect, { target: { value: plants[0].id } });

    await waitFor(() => expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled());
    const accessorySelect = screen.getByLabelText(/Accessory/i, { selector: "select" });
    fireEvent.change(accessorySelect, { target: { value: accessories[0].id } });
    fireEvent.change(screen.getByLabelText(/Accessory quantity/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /Add accessory/i }));

    expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled());
    await waitFor(() => expect(screen.getByLabelText(/Part name/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Part name/i), { target: { value: "Part A" } });
    fireEvent.change(screen.getByLabelText(/Part family/i), { target: { value: partFamilies[0].id } });
    fireEvent.change(screen.getByLabelText(/Parts per packaging/i), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /Add part/i }));

    expect(screen.getByRole("button", { name: /^Next$/i })).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    });
    await waitFor(() => expect(screen.getByText(/Upload visuals/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    });
    await waitFor(() => expect(screen.getByText(/Review before submit/i)).toBeInTheDocument());

    const createButton = await screen.findByRole("button", { name: /Create/i });
    expect(createButton).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0] as FormData;
    const accessoriesPayload = JSON.parse(payload.get("accessories") as string);
    const partsPayload = JSON.parse(payload.get("parts") as string);

    expect(accessoriesPayload).toEqual([{ accessoryId: accessories[0].id, qty: 2 }]);
    expect(partsPayload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Part A", partFamilyId: partFamilies[0].id, partsPerPackaging: 3 }),
      ])
    );
  });
});
