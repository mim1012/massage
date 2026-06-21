import { promises as fs } from 'node:fs';
import path from 'node:path';
import { validateUploadFiles } from '@/app/api/admin/upload/upload-validation';
import { requireRole } from '@/lib/auth/guards';
import { errorResponse } from '@/lib/auth/http';

export async function POST(request: Request) {
  try {
    // Only ADMIN or OWNER can upload images
    await requireRole('ADMIN', 'OWNER');

    const formData = await request.formData();
    const files = formData.getAll('file').filter((entry): entry is File => entry instanceof File);
    const validation = await validateUploadFiles(files);

    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: validation.status });
    }

    const uploadUrls: string[] = [];
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists
    await fs.mkdir(publicUploadDir, { recursive: true });

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Unique file name to prevent duplication/overwriting
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.name).toLowerCase();
      const filename = `${uniqueSuffix}${ext}`;
      const filepath = path.join(publicUploadDir, filename);

      await fs.writeFile(filepath, buffer);
      uploadUrls.push(`/uploads/${filename}`);
    }

    return Response.json({ urls: uploadUrls }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
