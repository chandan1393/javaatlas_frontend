import { Stage } from '../core/models';
import { STAGES_A } from './lessons-a';
import { STAGES_B } from './lessons-b';
import { STAGES_C } from './lessons-c';
import { STAGES_D } from './lessons-d';
import { EXTRA_LESSONS, EXTRA_STAGES } from './lessons-e';

/**
 * The complete curriculum in teaching order: the base stages plus the lessons and stages from lessons-e.ts.
 * Used by the app (ContentService) and by the prerenderer (app.routes.server.ts), so both always agree.
 */
export const CURRICULUM: Stage[] = withExtras([...STAGES_A, ...STAGES_D, ...STAGES_B, ...STAGES_C]);

function withExtras(base: Stage[]): Stage[] {
  const stages = base.map((st) => ({ ...st, lessons: [...st.lessons] }));
  for (const extra of EXTRA_LESSONS) {
    const stage = stages.find((st) => st.id === extra.stage);
    const at = stage ? stage.lessons.findIndex((l) => l.id === extra.after) : -1;
    if (!stage || at < 0) throw new Error(`lessons-e: can't place lessons after ${extra.stage}/${extra.after}`);
    stage.lessons.splice(at + 1, 0, ...extra.lessons);
  }
  for (const extra of EXTRA_STAGES) {
    const at = stages.findIndex((st) => st.id === extra.after);
    if (at < 0) throw new Error(`lessons-e: unknown stage ${extra.after}`);
    stages.splice(at + 1, 0, extra.stage);
  }
  const ids = stages.flatMap((st) => st.lessons.map((l) => l.id));
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`Duplicate lesson ids: ${dupes.join(', ')}`);
  return stages;
}
