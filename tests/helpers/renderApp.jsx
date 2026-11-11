import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App";
import { StoreProvider } from "../../src/store/Store";
import { saveState, SESSION_KEY } from "../../src/store/persistence";

export function openApp(route = "/login", role, state) {
  if (role) sessionStorage.setItem(SESSION_KEY, role);
  if (state) saveState(state);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  );
}

export const main = () => within(screen.getByRole("main"));
export const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), {
    target: { value: String(value) },
  });
