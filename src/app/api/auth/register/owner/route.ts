import { handleOwnerRegisterPost } from './post';

export async function POST(request: Request) {
  return handleOwnerRegisterPost(request);
}
