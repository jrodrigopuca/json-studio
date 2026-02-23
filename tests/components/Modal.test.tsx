/**
 * Modal component tests.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Modal, UnsavedChangesModal, SaveJsonModal } from "@viewer/components/Modal";
import { resetStore } from "../helpers";

afterEach(resetStore);

describe("Modal", () => {
	it("renders nothing when isOpen is false", () => {
		render(
			<Modal isOpen={false} title="Test" onClose={vi.fn()}>
				<p>Content</p>
			</Modal>,
		);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders when isOpen is true", () => {
		render(
			<Modal isOpen={true} title="Test Title" onClose={vi.fn()}>
				<p>Content here</p>
			</Modal>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Content here")).toBeInTheDocument();
	});

	it("renders action buttons", () => {
		render(
			<Modal
				isOpen={true}
				title="Test"
				onClose={vi.fn()}
				actions={<button>Confirm</button>}
			>
				<p>Body</p>
			</Modal>,
		);

		expect(screen.getByText("Confirm")).toBeInTheDocument();
	});

	it("calls onClose on Escape key", () => {
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} title="Test" onClose={onClose}>
				<p>Content</p>
			</Modal>,
		);

		fireEvent.keyDown(document, { key: "Escape" });

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose on overlay click", () => {
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} title="Test" onClose={onClose}>
				<p>Content</p>
			</Modal>,
		);

		// Click the overlay (parent of the dialog)
		const overlay = screen.getByRole("dialog").parentElement!;
		fireEvent.click(overlay);

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("does not close on modal content click", () => {
		const onClose = vi.fn();
		render(
			<Modal isOpen={true} title="Test" onClose={onClose}>
				<p>Content</p>
			</Modal>,
		);

		fireEvent.click(screen.getByRole("dialog"));

		expect(onClose).not.toHaveBeenCalled();
	});

	it("has aria-modal=true", () => {
		render(
			<Modal isOpen={true} title="Test" onClose={vi.fn()}>
				<p>Content</p>
			</Modal>,
		);

		expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
	});
});

describe("UnsavedChangesModal", () => {
	it("renders with save, discard, and cancel buttons", () => {
		render(
			<UnsavedChangesModal
				isOpen={true}
				onSave={vi.fn()}
				onDiscard={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		// Should have three action buttons
		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBeGreaterThanOrEqual(3);
	});

	it("calls onSave on save button click", () => {
		const onSave = vi.fn();
		render(
			<UnsavedChangesModal
				isOpen={true}
				onSave={onSave}
				onDiscard={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);

		// Find the save button (last primary action)
		const buttons = screen.getAllByRole("button");
		const saveBtn = buttons.find((b) => b.textContent?.match(/save/i));
		expect(saveBtn).toBeTruthy();
		fireEvent.click(saveBtn!);

		expect(onSave).toHaveBeenCalledOnce();
	});

	it("calls onDiscard on discard button click", () => {
		const onDiscard = vi.fn();
		render(
			<UnsavedChangesModal
				isOpen={true}
				onSave={vi.fn()}
				onDiscard={onDiscard}
				onCancel={vi.fn()}
			/>,
		);

		const discardBtn = screen.getAllByRole("button").find((b) =>
			b.textContent?.match(/discard/i),
		);
		expect(discardBtn).toBeTruthy();
		fireEvent.click(discardBtn!);

		expect(onDiscard).toHaveBeenCalledOnce();
	});
});

describe("SaveJsonModal", () => {
	it("renders with name input and action buttons", () => {
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={vi.fn()}
				currentSize={1024}
				savedCount={2}
			/>,
		);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("disables save when name is empty", () => {
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={vi.fn()}
				currentSize={1024}
				savedCount={2}
			/>,
		);

		const saveBtn = screen.getAllByRole("button").find((b) =>
			b.textContent?.match(/save/i),
		);
		expect(saveBtn).toBeDisabled();
	});

	it("enables save when name is typed", () => {
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={vi.fn()}
				currentSize={1024}
				savedCount={2}
			/>,
		);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "my-json" } });

		const saveBtn = screen.getAllByRole("button").find((b) =>
			b.textContent?.match(/save/i),
		);
		expect(saveBtn).not.toBeDisabled();
	});

	it("calls onSave with name on save click", () => {
		const onSave = vi.fn();
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={onSave}
				currentSize={1024}
				savedCount={2}
			/>,
		);

		fireEvent.change(screen.getByRole("textbox"), { target: { value: "my json" } });

		const saveBtn = screen.getAllByRole("button").find((b) =>
			b.textContent?.match(/save/i),
		);
		fireEvent.click(saveBtn!);

		expect(onSave).toHaveBeenCalledWith("my json");
	});

	it("shows size warning when over limit", () => {
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={vi.fn()}
				currentSize={600 * 1024}
				savedCount={2}
				maxSize={500 * 1024}
			/>,
		);

		// Should show a warning about exceeded size
		const warning = document.querySelector("[class*='warning']");
		expect(warning).toBeTruthy();
	});

	it("shows count warning when at limit", () => {
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={vi.fn()}
				currentSize={1024}
				savedCount={10}
				maxCount={10}
			/>,
		);

		// Save button should be disabled
		const saveBtn = screen.getAllByRole("button").find((b) =>
			b.textContent?.match(/save/i),
		);
		expect(saveBtn).toBeDisabled();
	});

	it("handles Enter key to save", () => {
		const onSave = vi.fn();
		render(
			<SaveJsonModal
				isOpen={true}
				onClose={vi.fn()}
				onSave={onSave}
				currentSize={1024}
				savedCount={2}
			/>,
		);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "enter-test" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onSave).toHaveBeenCalledWith("enter-test");
	});
});
