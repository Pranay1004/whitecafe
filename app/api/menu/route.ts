// GET /api/menu — Get menu items
export const runtime = 'nodejs';

import { menuStore, seedIfNeeded } from '@/lib/store';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    await seedIfNeeded();

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let items;
    if (type === 'veg' || type === 'nonveg') {
      items = menuStore.getByType(type);
    } else {
      items = menuStore.getAll();
    }

    return Response.json({
      success: true,
      data: items.filter((i) => i.available),
    } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
