"use client";

import { useRef, useState } from "react";
import { Check, X, Phone, Mail, User, Clock, Store, Users } from "lucide-react";
import type { User as UserType } from "@/lib/types";
import clsx from "clsx";

type ApprovalData = {
  pendingUsers: UserType[];
  processedUsers: UserType[];
};

function getActionErrorMessage(result: unknown, fallback: string) {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof result.error === "string" &&
    result.error.trim().length > 0
  ) {
    return result.error;
  }

  return fallback;
}

export default function ApprovalsPageClient({ initialData }: { initialData: ApprovalData }) {
  const [data, setData] = useState<ApprovalData>(initialData);
  const [actionError, setActionError] = useState<string | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleDecision = async (userId: string, decision: "approved" | "rejected") => {
    if (pendingRef.current.size > 0) return;
    pendingRef.current.add(userId);
    setPendingIds(new Set(pendingRef.current));
    setActionError(null);

    try {
      const endpoint = decision === "approved" ? "approve" : "reject";
      const response = await fetch(`/api/admin/approvals/${userId}/${endpoint}`, {
        method: "PATCH",
        cache: "no-store",
      });
      const result = (await response.json().catch(() => ({}))) as { user?: UserType; error?: string };

      if (!response.ok || !result.user) {
        setActionError(
          getActionErrorMessage(
            result,
            decision === "approved" ? "가입 승인 처리에 실패했습니다." : "반려 처리에 실패했습니다.",
          ),
        );
        return;
      }

      setData((prev) => {
        const target = prev.pendingUsers.find((user) => user.id === userId);
        if (!target) return prev;

        return {
          pendingUsers: prev.pendingUsers.filter((user) => user.id !== userId),
          processedUsers: [
            { ...target, ...result.user, status: decision },
            ...prev.processedUsers,
          ],
        };
      });
    } finally {
      pendingRef.current.delete(userId);
      setPendingIds(new Set(pendingRef.current));
    }
  };
  const hasPendingAction = pendingIds.size > 0;

  const displayName = (user: UserType) => user.businessName?.trim() || user.name;

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="flex items-center gap-2 text-xl font-black text-gray-800">
          <Store className="h-5 w-5 text-red-600" /> 입점 및 회원 승인 관리
        </h1>
        <div className="flex gap-3 rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-500">
          <span>가입 대기: {data.pendingUsers.length}건</span>
          <span className="text-gray-300">|</span>
          <span>업소 대기: 0건</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 border-b pb-2 text-lg font-bold text-gray-800">
          <Users className="h-5 w-5 text-blue-500" /> 대기 중인 입점사 회원가입 ({data.pendingUsers.length})
        </h2>

        {actionError ? (
          <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
        ) : null}

        {data.pendingUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">대기 중인 회원가입 요청이 없습니다.</div>
        ) : (
          <div className="grid gap-4">
            {data.pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50/30 p-4 md:flex-row md:items-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-800">{displayName(user)}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">가입승인대기</span>
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> 이름: {user.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> 이메일: {user.email}
                    </div>
                    {user.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> 연락처: {user.phone}
                      </div>
                    ) : null}
                    {user.businessNumber ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> 사업자번호: {user.businessNumber}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={hasPendingAction}
                    onClick={() => void handleDecision(user.id, "approved")}
                    className="flex items-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> 가입승인
                  </button>
                  <button
                    disabled={hasPendingAction}
                    onClick={() => void handleDecision(user.id, "rejected")}
                    className="flex items-center gap-1 rounded bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> 반려
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 border-b pb-2 text-lg font-bold text-gray-800">최근 처리 내역</h2>
        {data.processedUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">처리 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-center font-bold">유형</th>
                  <th className="px-4 py-2 text-center font-bold">상태</th>
                  <th className="px-4 py-2 font-bold">이름/업소명</th>
                  <th className="px-4 py-2 font-bold">이메일</th>
                  <th className="px-4 py-2 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-xs font-bold text-blue-600">회원가입</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-bold",
                          user.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                        )}
                      >
                        {user.status === "approved" ? "승인완료" : "반려됨"}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-gray-800">{displayName(user)}</td>
                    <td className="px-4 py-2 text-gray-500">{user.email}</td>
                    <td className="px-4 py-2 text-gray-500">{user.phone ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
