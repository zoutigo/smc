/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { ImageInput } from "@/components/forms/ImageInput";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_MB } from "@/lib/constants/uploads";

describe("ImageInput", () => {
  const renderInput = (props?: Partial<React.ComponentProps<typeof ImageInput>>) => {
    const onChange = jest.fn();
    const defaultProps: React.ComponentProps<typeof ImageInput> = {
      files: [],
      onChange,
      label: "Images",
      helperText: "helper",
    };
    const result = render(<ImageInput {...defaultProps} {...props} onChange={props?.onChange ?? onChange} />);
    return { onChange: props?.onChange ?? onChange, ...result };
  };

  const createFile = (name: string, type: string, size = 10) =>
    new File([new Uint8Array(size)], name, { type });

  const getFileInput = () => {
    const dropZone = screen.getByText(/drag & drop images here/i).closest("div")!;
    const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;
    return input;
  };

  it("accepts valid image files and calls onChange", () => {
    const { onChange } = renderInput();
    const input = getFileInput();
    const files = [createFile("a.png", "image/png"), createFile("b.jpg", "image/jpeg")];

    fireEvent.change(input, { target: { files } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = (onChange as jest.Mock).mock.calls[0][0] as File[];
    expect(calledWith.map((f) => f.name)).toEqual(["a.png", "b.jpg"]);
    expect(screen.queryByText(/only image files/i)).not.toBeInTheDocument();
  });

  it("shows error for non-image files and does not call onChange", () => {
    const { onChange } = renderInput();
    const input = getFileInput();
    const files = [createFile("doc.pdf", "application/pdf")];

    fireEvent.change(input, { target: { files } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/only image files/i)).toBeInTheDocument();
  });

  it("shows error when total size exceeds limit and does not call onChange", () => {
    const { onChange } = renderInput();
    const input = getFileInput();
    const tooBig = createFile("big.png", "image/png", MAX_IMAGE_UPLOAD_BYTES + 1);

    fireEvent.change(input, { target: { files: [tooBig] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(new RegExp(`${MAX_IMAGE_UPLOAD_MB} MB`, "i"))).toBeInTheDocument();
  });

  it("displays external error prop", () => {
    renderInput({ error: "Server error" });
    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("removes an image when clicking remove button", () => {
    const file = createFile("keep.png", "image/png");
    const onChange = jest.fn();
    renderInput({ files: [file], onChange });

    const removeBtn = screen.getByRole("button", { name: /remove image/i });
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("handles drop events and clears dragging state", () => {
    const { onChange } = renderInput();
    const dropZone = screen.getByText(/drag & drop images here/i).parentElement as HTMLElement;
    const file = createFile("drop.png", "image/png");

    fireEvent.dragOver(dropZone, { preventDefault: jest.fn() });
    fireEvent.drop(dropZone, { preventDefault: jest.fn(), dataTransfer: { files: [file] } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it("surfaces drop errors for non-image files", () => {
    const { onChange } = renderInput();
    const dropZone = screen.getByText(/drag & drop images here/i).parentElement as HTMLElement;
    const badFile = createFile("bad.txt", "text/plain");

    fireEvent.drop(dropZone, { preventDefault: jest.fn(), dataTransfer: { files: [badFile] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/only image files/i)).toBeInTheDocument();
  });

  it("clears local error after a valid upload", () => {
    const { onChange } = renderInput();
    const input = getFileInput();
    const badFile = createFile("doc.pdf", "application/pdf");

    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText(/only image files/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    const goodFile = createFile("good.png", "image/png");
    fireEvent.change(input, { target: { files: [goodFile] } });

    expect(onChange).toHaveBeenCalledWith([goodFile]);
    expect(screen.queryByText(/only image files/i)).not.toBeInTheDocument();
  });

  it("supports selecting multiple images at once", () => {
    const { onChange } = renderInput();
    const input = getFileInput();
    const files = [createFile("one.png", "image/png"), createFile("two.png", "image/png"), createFile("three.png", "image/png")];

    fireEvent.change(input, { target: { files } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = (onChange as jest.Mock).mock.calls[0][0] as File[];
    expect(calledWith).toHaveLength(3);
    expect(calledWith.map((f) => f.name)).toEqual(["one.png", "two.png", "three.png"]);
  });

  it("renders existing images and calls onRemoveExisting", () => {
    const onRemoveExisting = jest.fn();
    renderInput({
      existingImages: [{ id: "img-1", url: "https://example.com/a.png" }],
      onRemoveExisting,
    });

    expect(screen.getByAltText(/existing image/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /remove existing image/i }));
    expect(onRemoveExisting).toHaveBeenCalledWith("img-1");
  });
});
