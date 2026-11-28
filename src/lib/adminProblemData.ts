import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PROBLEM_TYPES, type ProblemType } from "@/lib/problemTypes";

export async function problemFormOptions() {
  const [tags, users] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ orderBy: { username: "asc" }, select: { username: true, displayName: true } }),
  ]);
  return { tags, users };
}

export async function listAdminProblems(params: { type?: string; page?: string; q?: string; reorder?: string }) {
  const type = (PROBLEM_TYPES.find((value) => value === params.type) ?? "PROGRAMMING");
  const query = params.q?.trim() ?? "";
  const reorderMode = params.reorder === "1";
  const queryNumber = /^\d+$/.test(query) ? Number(query) : null;
  const where: Prisma.ProblemWhereInput = {
    type,
    ...(query && { OR: [
      { title: { contains: query } },
      { problemCode: { contains: query } },
      ...(queryNumber !== null && Number.isSafeInteger(queryNumber) ? [{ order: queryNumber }] : []),
    ] }),
  };
  const pageSize = 50;
  const total = await prisma.problem.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number(params.page);
  const currentPage = Math.min(Number.isSafeInteger(page) && page > 0 ? page : 1, totalPages);
  const [problems, options, pendingProposals] = await Promise.all([
    prisma.problem.findMany({
      where: reorderMode ? { type } : where,
      orderBy: [{ problemCode: "asc" }, { order: "asc" }, { id: "asc" }],
      ...(reorderMode ? {} : { skip: (currentPage - 1) * pageSize, take: pageSize }),
      select: {
        id: true, problemCode: true, order: true, type: true, title: true, difficulty: true,
        isPublic: true, paper: true, sourceNumber: true, category: true,
        _count: { select: { testCases: true, submissions: true } },
        cluster: { select: { title: true } },
        author: { select: { username: true, displayName: true } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    }),
    problemFormOptions(),
    prisma.problemProposal.count({ where: { status: "PENDING" } }),
  ]);
  const rows = problems.map(({ _count, cluster, tags, ...problem }) => ({
    ...problem,
    testCaseCount: _count.testCases,
    submissionCount: _count.submissions,
    clusterTitle: cluster?.title ?? null,
    tags: tags.map(({ tag }) => tag),
  }));
  return { rows, ...options, type, query, reorderMode, total, totalPages, currentPage, pendingProposals };
}

export async function readAdminProblem(id: number) {
  const problem = await prisma.problem.findUnique({
    where: { id },
    select: {
      id: true, problemCode: true, type: true, title: true, statement: true, difficulty: true,
      timeLimitMs: true, memoryLimitMb: true, isPublic: true, pdfFilename: true, pdfPassword: true,
      code: true, options: true, answerIndex: true, explanation: true, paper: true, sourceNumber: true,
      category: true, author: { select: { username: true } },
      testCases: { orderBy: [{ order: "asc" }, { id: "asc" }], select: { input: true, output: true, isSample: true, subtaskId: true } },
      subtasks: { orderBy: { order: "asc" }, select: { id: true, points: true, checkMode: true } },
      tags: { select: { tagId: true } },
    },
  });
  if (!problem) return null;
  const { pdfPassword, author, tags, subtasks, testCases, options: rawOptions, problemCode, ...fields } = problem;
  const subtaskIndex = new Map(subtasks.map((subtask, index) => [subtask.id, index]));
  const options = JSON.parse(rawOptions ?? "[]") as string[];
  return {
    ...await problemFormOptions(),
    problemCode,
    initial: {
      ...fields,
      type: fields.type as ProblemType,
      authorUsername: author?.username ?? "",
      pdfHasPassword: Boolean(pdfPassword),
      tagIds: tags.map(({ tagId }) => tagId),
      subtasks: subtasks.map(({ points, checkMode }) => ({
        points, checkMode: checkMode === "firstLine" || checkMode === "float" ? checkMode : "full" as const,
      })),
      testCases: testCases.map(({ subtaskId, ...testCase }) => ({
        ...testCase, subtaskIndex: subtaskId === null ? null : subtaskIndex.get(subtaskId) ?? null,
      })),
      code: fields.code ?? "", options: options.length >= 2 ? options : ["", ""],
      answerIndex: fields.answerIndex ?? 0, explanation: fields.explanation ?? "",
      paper: fields.paper ?? "", category: fields.category ?? "C",
    },
  };
}
