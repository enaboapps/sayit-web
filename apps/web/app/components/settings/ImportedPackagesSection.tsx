'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/app/components/ui/Button';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';

type Variant = 'sheet' | 'desktop';

// Lists every AAC vocabulary the current user has imported, with a
// per-package Delete button. The mutation flips `pendingDelete` (boards
// disappear from the picker immediately) and a scheduled internal action
// chunks through the actual cascade — see convex/openBoardImport.ts.
//
// Used in both layouts of /settings: as a bottom-sheet body on mobile and
// as an inline section on desktop. The `variant` only changes container
// styling, the data + actions are identical.
export default function ImportedPackagesSection({ variant }: { variant: Variant }) {
  const packages = useQuery(api.phraseBoards.listImportedPackages);
  const deletePackage = useMutation(api.openBoardImport.deleteImportedPackage);
  const [deletingId, setDeletingId] = useState<Id<'importedPackages'> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<'importedPackages'>;
    name: string;
    boardCount: number;
  } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deletePackage({ packageId: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err) {
      // Re-throw to surface in the dev console; user-visible error UX would
      // require a toast system that isn't part of this section's scope.
      console.error('Failed to delete imported package:', err);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const headingClass = variant === 'desktop' ? 'text-lg font-semibold text-foreground' : 'sr-only';
  const containerClass = variant === 'desktop'
    ? 'space-y-3'
    : 'space-y-3';

  if (packages === undefined) {
    return (
      <div className={containerClass}>
        <h3 className={headingClass}>Imported AAC vocabularies</h3>
        <div className="animate-pulse h-16 rounded-2xl bg-surface-hover" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className={containerClass}>
        <h3 className={headingClass}>Imported AAC vocabularies</h3>
        <div className="rounded-2xl bg-surface-hover/40 p-4 text-sm text-text-secondary">
          No imported vocabularies yet. Use the Import option from the boards screen to add one from a .obf or .obz file.
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <h3 className={headingClass}>Imported AAC vocabularies</h3>
      <ul className="space-y-2">
        {packages.map((pkg) => {
          const isDeleting = deletingId === pkg.id || pkg.pendingDelete;
          const dateLabel = new Date(pkg.importedAt).toLocaleDateString();
          return (
            <li
              key={pkg.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 ${isDeleting ? 'opacity-60' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex-shrink-0 rounded-2xl bg-surface-hover p-2 text-primary-500">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{pkg.name}</div>
                  <div className="text-xs text-text-secondary">
                    {pkg.boardCount} board{pkg.boardCount === 1 ? '' : 's'} · imported {dateLabel}
                    {pkg.pendingDelete ? ' · removing...' : ''}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget({
                  id: pkg.id,
                  name: pkg.name,
                  boardCount: pkg.boardCount,
                })}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600"
                aria-label={`Delete ${pkg.name}`}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Imported Vocabulary"
        description={deleteTarget
          ? `Delete "${deleteTarget.name}"? This removes all ${deleteTarget.boardCount} board${deleteTarget.boardCount === 1 ? '' : 's'} from this import. Phrases and symbols are removed in the background.`
          : ''}
        confirmLabel="Delete Vocabulary"
        isBusy={deletingId !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
