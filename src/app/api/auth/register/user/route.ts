import { handleUserRegisterPost } from './post';

export async function POST(request: Request) {
  return handleUserRegisterPost(request);
}
