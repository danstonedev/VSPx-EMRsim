/**
 * Reusable drag-reorder logic for sortable lists.
 * Eliminates duplicated dragStart/dragOver/drop/dragEnd
 * implementations across PlanSection's goals, in-clinic, and HEP lists.
 */
export function createDragReorder<T>(getItems: () => T[], setItems: (items: T[]) => void) {
  let srcIdx: number | null = $state(null);

  return {
    get dragIdx() {
      return srcIdx;
    },
    dragStart(index: number, e: DragEvent) {
      srcIdx = index;
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(index));
    },
    dragOver(e: DragEvent) {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    },
    drop(toIndex: number, e: DragEvent) {
      e.preventDefault();
      if (srcIdx === null || srcIdx === toIndex) return;
      const items = [...getItems()];
      const [moved] = items.splice(srcIdx, 1);
      items.splice(toIndex, 0, moved);
      setItems(items);
      srcIdx = null;
    },
    dragEnd() {
      srcIdx = null;
    },
  };
}
