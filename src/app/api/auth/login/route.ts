import { handleLoginPost } from './post';

export async function POST(request: Request) {
  return handleLoginPost(request);
}
