import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

const globalWithPolyfills = global as typeof globalThis;

// Ensure WHATWG-style APIs are available in test environments without extra deps
globalWithPolyfills.fetch = jest.fn(async () => ({
	ok: true,
	json: async () => ({ storageCategories: [], packagingCategories: [], transportCategories: [] }),
})) as unknown as typeof fetch;

if (!globalWithPolyfills.Request) {
	class SimpleRequest {
		url: string;
		constructor(input: string, init?: RequestInit) {
			this.url = input;
			void init;
		}
	}
	globalWithPolyfills.Request = SimpleRequest as typeof Request;
}

if (!globalWithPolyfills.Headers) {
	class SimpleHeaders {
		private map = new Map<string, string>();
		append(key: string, value: string) {
			this.map.set(key.toLowerCase(), value);
		}
		get(key: string) {
			return this.map.get(key.toLowerCase()) ?? null;
		}
	}
	globalWithPolyfills.Headers = SimpleHeaders as unknown as typeof Headers;
}

if (!globalWithPolyfills.Response) {
	class SimpleResponse<T = unknown> {
		body: T;
		status: number;
		constructor(body?: T, init?: { status?: number }) {
			this.body = body as T;
			this.status = init?.status ?? 200;
		}
	}
	globalWithPolyfills.Response = SimpleResponse as typeof Response;
}

if (!globalWithPolyfills.FormData) {
	class SimpleFormData {
		private store = new Map<string, unknown[]>();
		append(key: string, value: unknown) {
			const arr = this.store.get(key) ?? [];
			arr.push(value);
			this.store.set(key, arr);
		}
		get(key: string) {
			const arr = this.store.get(key);
			return arr ? arr[0] ?? null : null;
		}
		entries() {
			return Array.from(this.store.entries()).flatMap(([k, arr]) => arr.map((v) => [k, v] as [string, unknown]));
		}
		[Symbol.iterator]() {
			return this.entries()[Symbol.iterator]();
		}
	}
	globalWithPolyfills.FormData = SimpleFormData as unknown as typeof FormData;
}

beforeAll(() => {
	jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	jest.restoreAllMocks();
});
