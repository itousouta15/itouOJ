"use client";

import Link from "next/link";
import Markdown from "@/components/Markdown";
import Avatar from "@/components/Avatar";

export interface DiscussionAuthor {
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorIsAdmin: boolean;
}

export interface DiscussionComment extends DiscussionAuthor {
  id: number;
  content: string;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
  edited: boolean;
  replies?: DiscussionComment[];
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
  });
}

// 頭像 + 名字（連到個人頁）+ 管理員標記 + 時間。留言、回覆、題解共用同一個表頭。
export function AuthorLine({
  author,
  at,
  size = 32,
  edited = false,
}: {
  author: DiscussionAuthor;
  at: string;
  size?: number;
  edited?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/users/${author.authorUsername}`} className="shrink-0">
        <Avatar
          name={author.authorName}
          src={author.authorAvatarUrl}
          size={size}
        />
      </Link>
      <div className="flex flex-wrap items-center gap-x-2 text-sm leading-tight">
        <Link
          href={`/users/${author.authorUsername}`}
          className="font-semibold text-tx hover:text-blue hover:underline"
        >
          {author.authorName}
        </Link>
        {author.authorIsAdmin && (
          <span className="rounded bg-inset px-1.5 py-0.5 text-xs text-dim">
            管理員
          </span>
        )}
        <span className="mono text-xs text-mute">{formatTime(at)}</span>
        {edited && <span className="text-xs text-mute">（已編輯）</span>}
      </div>
    </div>
  );
}

interface Props {
  comment: DiscussionComment;
  // 主留言 32、回覆 24（原本兩邊只有頭像大小與間距不同）
  size?: number;
  editingId: number | null;
  editDraft: string;
  savingEdit: boolean;
  onStartEdit: (id: number, content: string) => void;
  onCancelEdit: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// 一則留言／回覆的表頭、編輯/刪除按鈕與編輯表單。主留言與回覆共用，
// 避免兩份幾乎一樣的 JSX 各自漂移。
export default function CommentItem({
  comment,
  size = 32,
  editingId,
  editDraft,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onSaveEdit,
  onDelete,
}: Props) {
  const editing = editingId === comment.id;
  const isReply = size < 32;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <AuthorLine
          author={comment}
          at={comment.createdAt}
          size={size}
          edited={comment.edited}
        />
        {!editing && (
          <div className="flex shrink-0 items-center gap-3">
            {comment.canEdit && (
              <button
                type="button"
                className="text-xs text-mute hover:text-blue"
                onClick={() => onStartEdit(comment.id, comment.content)}
              >
                編輯
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                className="text-xs text-mute hover:text-[#ff6b6b]"
                onClick={() => onDelete(comment.id)}
              >
                刪除
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className={isReply ? "mt-2" : "mt-3"}>
          <textarea
            className={`input text-sm ${isReply ? "h-20" : "h-24"}`}
            value={editDraft}
            onChange={(e) => onEditDraftChange(e.target.value)}
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={onCancelEdit}
              disabled={savingEdit}
            >
              取消
            </button>
            <button
              className="btn-primary"
              disabled={savingEdit || !editDraft.trim()}
              onClick={() => onSaveEdit(comment.id)}
            >
              {savingEdit ? "儲存中…" : "儲存"}
            </button>
          </div>
        </div>
      ) : (
        <div className={isReply ? "mt-1 text-sm" : "mt-2 text-sm"}>
          <Markdown>{comment.content}</Markdown>
        </div>
      )}
    </>
  );
}
