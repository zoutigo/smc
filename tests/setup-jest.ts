import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

beforeAll(() => {
	jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	jest.restoreAllMocks();
});
