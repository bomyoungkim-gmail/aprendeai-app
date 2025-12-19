# Frontend Testing

## Setup

```bash
cd frontend

# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Run tests
npm test
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/CornellPanel.spec.tsx
```

## Test Structure

```
frontend/tests/
├── setup.ts                      # Test setup and mocks
├── unit/                         # Component unit tests
│   ├── CornellPanel.spec.tsx
│   └── HighlightLink.spec.tsx
├── integration/                  # Integration tests (TODO)
└── e2e/                          # E2E tests with Playwright
```

## Writing Tests

### Component Test Example

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

it("should render correctly", () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText("Test")).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it("should handle click", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);

  fireEvent.click(screen.getByRole("button"));

  await waitFor(() => {
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Mocking API Calls

```typescript
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn().mockResolvedValue({ data: "mock" }),
}));
```

## Coverage

Current coverage goals:

- **Cornell Panel:** 80%+
- **Highlight Components:** 75%+
- **Critical paths:** 90%+

## Current Tests

### ✅ CornellPanel.spec.tsx (13 tests)

- Rendering sections
- Toggle mode behavior
- Autosave with debouncing
- Data persistence
- Error handling

### ✅ HighlightLink.spec.tsx (8 tests)

- Highlight creation
- Display with colors
- Hover tooltips
- Navigation to notes
- Deletion

**Total:** 21 frontend unit tests
