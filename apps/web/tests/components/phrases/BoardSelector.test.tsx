import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardSelector from '@/app/components/phrases/BoardSelector';
import type { BoardSummary } from '@/app/components/phrases/types';

const mockOnSelectBoard = jest.fn();
const mockOnEditBoard = jest.fn();

const createBoard = (overrides: Partial<BoardSummary> = {}): BoardSummary => ({
  id: 'board-1',
  name: 'Test Board',
  position: 0,
  phrases: [],
  ...overrides,
});

describe('BoardSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no boards', () => {
    const { container } = render(
      <BoardSelector
        boards={[]}
        selectedBoard={null}
        isEditMode={false}
        onSelectBoard={mockOnSelectBoard}
        onEditBoard={mockOnEditBoard}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  describe('single board', () => {
    it('displays board name', () => {
      const board = createBoard({ name: 'My Board' });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.getByText('My Board')).toBeInTheDocument();
    });

    it('shows a persistent edit-mode status and Done action', () => {
      const board = createBoard();
      const onEdit = jest.fn();

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={true}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
          onEdit={onEdit}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Edit mode');
      expect(screen.getByRole('button', { name: 'Done editing' })).toBeInTheDocument();
    });

    it('hides edit icon for view-only shared board', () => {
      const board = createBoard({
        isShared: true,
        accessLevel: 'view',
        sharedBy: 'Caregiver',
      });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={true}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
          onEdit={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: 'Done editing' })).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Phrases')).not.toBeInTheDocument();
    });

    it('shows edit icon for edit-access shared board', () => {
      const board = createBoard({
        isShared: true,
        accessLevel: 'edit',
        sharedBy: 'Caregiver',
      });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={true}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('shared board indicator', () => {
    it('shows "Shared by" for shared boards', () => {
      const board = createBoard({
        isShared: true,
        sharedBy: 'John Doe',
      });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.getByText(/shared by john doe/i)).toBeInTheDocument();
    });

    it('shows "For [Client]" for client boards', () => {
      const board = createBoard({
        isOwner: true,
        forClientId: 'client-1',
        forClientName: 'Jane Smith',
      });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.getByText(/for jane smith/i)).toBeInTheDocument();
    });

    it('shows no subtitle for personal board', () => {
      const board = createBoard({
        isOwner: true,
        isShared: false,
      });

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.queryByText(/shared by/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/for /i)).not.toBeInTheDocument();
    });
  });

  describe('multiple boards', () => {
    it('shows dropdown trigger', () => {
      const boards = [
        createBoard({ id: 'board-1', name: 'Board 1' }),
        createBoard({ id: 'board-2', name: 'Board 2' }),
      ];

      render(
        <BoardSelector
          boards={boards}
          selectedBoard={boards[0]}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.getByRole('button', { name: /choose board/i })).toBeInTheDocument();
    });

    it('opens popup when clicked', async () => {
      const boards = [
        createBoard({ id: 'board-1', name: 'Board 1' }),
        createBoard({ id: 'board-2', name: 'Board 2' }),
      ];

      render(
        <BoardSelector
          boards={boards}
          selectedBoard={boards[0]}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /choose board/i }));

      // Popup should show with "Select a Board" title
      expect(screen.getByText('Select a Board')).toBeInTheDocument();
    });

    it('shows all boards in popup', async () => {
      const boards = [
        createBoard({ id: 'board-1', name: 'Board 1' }),
        createBoard({ id: 'board-2', name: 'Board 2' }),
        createBoard({ id: 'board-3', name: 'Board 3' }),
      ];

      render(
        <BoardSelector
          boards={boards}
          selectedBoard={boards[0]}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /choose board/i }));

      // All board names should be visible in popup
      expect(screen.getAllByText('Board 1')).toHaveLength(2); // In selector and popup
      expect(screen.getByText('Board 2')).toBeInTheDocument();
      expect(screen.getByText('Board 3')).toBeInTheDocument();
    });

    it('calls onSelectBoard when board selected in popup', async () => {
      const boards = [
        createBoard({ id: 'board-1', name: 'Board 1' }),
        createBoard({ id: 'board-2', name: 'Board 2' }),
      ];

      render(
        <BoardSelector
          boards={boards}
          selectedBoard={boards[0]}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /choose board/i }));
      await userEvent.click(screen.getByText('Board 2'));

      expect(mockOnSelectBoard).toHaveBeenCalledWith(boards[1]);
    });

    it('calls onEditBoard when edit clicked in edit mode', async () => {
      const boards = [
        createBoard({ id: 'board-1', name: 'Board 1' }),
        createBoard({ id: 'board-2', name: 'Board 2' }),
      ];

      render(
        <BoardSelector
          boards={boards}
          selectedBoard={boards[0]}
          isEditMode={true}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      // Open the more options menu, then click "Edit Board"
      const moreOptionsButton = screen.getByRole('button', { name: /more options/i });
      await userEvent.click(moreOptionsButton);
      const editBoardItem = screen.getByRole('button', { name: /edit board/i });
      await userEvent.click(editBoardItem);
      expect(mockOnEditBoard).toHaveBeenCalledWith('board-1');
    });
  });

  describe('accessibility', () => {
    it('renders board name', () => {
      const board = createBoard();

      render(
        <BoardSelector
          boards={[board]}
          selectedBoard={board}
          isEditMode={false}
          onSelectBoard={mockOnSelectBoard}
          onEditBoard={mockOnEditBoard}
        />
      );

      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });
  });
});
