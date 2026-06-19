import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders without crashing on server", () => {
    const client = new QueryClient();
    expect(renderToString(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/login"]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )).toContain("Вход");
  });
});
