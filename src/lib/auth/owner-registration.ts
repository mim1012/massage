type OwnerRegistrationBody = {
  name?: string;
  email?: string;
  password?: string;
  businessName?: string;
  businessNumber?: string;
  phone?: string;
};

type RegisteredOwner = {
  id: string;
  email: string;
  role: string;
  status?: string;
};

type RegisterOwnerDeps = {
  registerOwner: (input: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    businessNumber: string;
    phone: string;
  }) => Promise<RegisteredOwner>;
};

type OwnerRegistrationSuccessStateInput = {
  message?: string;
  nextUrl?: string;
  requiresApproval?: boolean;
};

export function getOwnerRegistrationSuccessState(input: OwnerRegistrationSuccessStateInput) {
  return {
    message: input.message ?? '관리자 승인 후 로그인할 수 있습니다.',
    nextUrl: input.nextUrl ?? '/auth/login',
    requiresApproval: input.requiresApproval ?? true,
  };
}

export async function registerOwnerRoute(body: OwnerRegistrationBody, deps: RegisterOwnerDeps) {
  if (!body.name || !body.email || !body.password || !body.businessName || !body.businessNumber || !body.phone) {
    return Response.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
  }

  const user = await deps.registerOwner({
    name: body.name,
    email: body.email,
    password: body.password,
    businessName: body.businessName,
    businessNumber: body.businessNumber,
    phone: body.phone,
  });

  return Response.json(
    {
      user,
      ...getOwnerRegistrationSuccessState({}),
    },
    { status: 201 },
  );
}
