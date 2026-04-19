'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DISTRICTS, REGIONS, THEMES, type Course, type Shop, type User } from '@/lib/types';

const DEFAULT_ADMIN: User = {
  id: 'admin',
  email: 'admin@massage.local',
  name: 'Admin',
  role: 'ADMIN',
};

function createInitialShop(currentUser: User): Shop {
  const defaultRegion = REGIONS.find((region) => region.code === 'seoul') ?? REGIONS[0];
  const defaultTheme = THEMES.find((theme) => theme.code === 'swedish') ?? THEMES[0];
  const baselineTime = new Date().toISOString();

  return {
    id: `shop-${Date.now()}`,
    name: '',
    slug: '',
    region: defaultRegion.code,
    regionLabel: defaultRegion.label,
    subRegion: '',
    subRegionLabel: '',
    theme: defaultTheme.code,
    themeLabel: defaultTheme.label,
    isPremium: false,
    premiumOrder: undefined,
    thumbnailUrl: '',
    bannerUrl: '',
    images: [],
    tagline: '',
    description: '',
    address: '',
    phone: '',
    hours: '',
    rating: 0,
    reviewCount: 0,
    courses: [],
    tags: [],
    isVisible: currentUser.role === 'ADMIN',
    ownerId: currentUser.id,
    createdAt: baselineTime,
    updatedAt: baselineTime,
  };
}

export default function ShopEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_ADMIN);
  const [form, setForm] = useState<Shop | null>(isNew ? createInitialShop(DEFAULT_ADMIN) : null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tagsStr, setTagsStr] = useState('');

  useEffect(() => {
    const load = async () => {
      const [meResponse, shopResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        isNew ? Promise.resolve(null) : fetch(`/api/admin/shops/${id}`, { cache: 'no-store' }),
      ]);

      const meResult = (await meResponse.json()) as { user?: User | null };
      const nextUser = meResult.user ?? DEFAULT_ADMIN;
      setCurrentUser(nextUser);

      if (isNew) {
        const initialShop = createInitialShop(nextUser);
        setForm(initialShop);
        setCourses(initialShop.courses);
        setTagsStr(initialShop.tags.join(', '));
        return;
      }

      if (!shopResponse) {
        return;
      }

      const shopResult = (await shopResponse.json()) as { shop?: Shop };
      if (shopResponse.ok && shopResult.shop) {
        setForm(shopResult.shop);
        setCourses(shopResult.shop.courses);
        setTagsStr(shopResult.shop.tags.join(', '));
      }
    };

    void load();
  }, [id, isNew]);

  if (!form) {
    return <div className="p-10 text-center text-gray-500">Loading shop...</div>;
  }

  if (!isNew && currentUser.role === 'OWNER' && form.ownerId !== currentUser.id) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        You can only edit shops that belong to your owner account.
      </div>
    );
  }

  const inputClassName =
    'w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none';
  const labelClassName = 'mb-1 block text-xs font-bold text-gray-700';
  const currentDistricts = DISTRICTS[form.region] ?? [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextShop: Shop = {
      ...form,
      courses,
      tags: tagsStr
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    const response = await fetch(isNew ? '/api/admin/shops' : `/api/admin/shops/${id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop: nextShop }),
    });

    if (response.ok) {
      router.push('/admin/shops');
    }
  };

  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRegion = REGIONS.find((region) => region.code === event.target.value);
    if (!nextRegion) {
      return;
    }

    setForm({
      ...form,
      region: nextRegion.code,
      regionLabel: nextRegion.label,
      subRegion: '',
      subRegionLabel: '',
    });
  };

  const handleDistrictChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDistrict = currentDistricts.find((district) => district.code === event.target.value);
    setForm({
      ...form,
      subRegion: event.target.value,
      subRegionLabel: nextDistrict?.label ?? '',
    });
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = THEMES.find((theme) => theme.code === event.target.value);
    if (!nextTheme) {
      return;
    }

    setForm({
      ...form,
      theme: nextTheme.code,
      themeLabel: nextTheme.label,
    });
  };

  const updateCourse = (index: number, field: keyof Course, value: string) => {
    setCourses((current) => {
      const nextCourses = [...current];
      nextCourses[index] = { ...nextCourses[index], [field]: value };
      return nextCourses;
    });
  };

  return (
    <div className="max-w-[800px] space-y-4 pb-10">
      <div className="mb-2 flex items-center gap-2">
        <Link href="/admin/shops" className="rounded p-1 text-gray-600 hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-gray-800">{isNew ? 'Create shop' : 'Edit shop'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">
            Basic info
          </h2>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Shop name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClassName}>Region</label>
              <select value={form.region} onChange={handleRegionChange} className={inputClassName}>
                {REGIONS.filter((region) => region.code !== 'all').map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>District</label>
              <select
                value={form.subRegion ?? ''}
                onChange={handleDistrictChange}
                className={inputClassName}
                disabled={currentDistricts.length === 0}
              >
                <option value="">Select</option>
                {currentDistricts
                  .filter((district) => district.code !== 'all')
                  .map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Theme</label>
              <select value={form.theme} onChange={handleThemeChange} className={inputClassName}>
                {THEMES.filter((theme) => theme.code !== 'all').map((theme) => (
                  <option key={theme.code} value={theme.code}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className={labelClassName}>Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(event) => setForm({ ...form, tagline: event.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="mb-3">
            <label className={labelClassName}>Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={`${inputClassName} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Hours</label>
              <input
                type="text"
                value={form.hours}
                onChange={(event) => setForm({ ...form, hours: event.target.value })}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClassName}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="mt-3">
            <label className={labelClassName}>Tags</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(event) => setTagsStr(event.target.value)}
              placeholder="spa, parking, late-night"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-800">Courses</h2>
            <button
              type="button"
              onClick={() =>
                setCourses((current) => [
                  ...current,
                  { name: '', price: '', duration: '', description: '' },
                ])
              }
              className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {courses.map((course, index) => (
              <div key={`${course.name}-${index}`} className="flex items-start gap-2">
                <input
                  type="text"
                  placeholder="Course"
                  value={course.name}
                  onChange={(event) => updateCourse(index, 'name', event.target.value)}
                  className={`${inputClassName} w-1/3`}
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={course.duration}
                  onChange={(event) => updateCourse(index, 'duration', event.target.value)}
                  className={`${inputClassName} w-1/4`}
                />
                <input
                  type="text"
                  placeholder="Price"
                  value={course.price}
                  onChange={(event) => updateCourse(index, 'price', event.target.value)}
                  className={`${inputClassName} flex-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setCourses((current) => current.filter((_, courseIndex) => courseIndex !== index))
                  }
                  className="rounded p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {courses.length === 0 ? (
              <p className="text-xs text-gray-400">No courses registered yet.</p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href="/admin/shops"
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
