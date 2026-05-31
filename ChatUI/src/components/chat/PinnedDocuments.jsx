import React from 'react'
import { Modal, Avatar, Button } from '@/components/common/index.js'
import { formatRelativeTime } from '@/utils/helpers.js'
import { Pin, FileText, Image, Video, File } from 'lucide-react'

const getMetadata = (metadata) => {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  }
  return metadata || {}
}

export const PinnedDocuments = ({
  isOpen,
  onClose,
  documents,
  onUnpin,
  onViewMessage,
}) => {
  const getFileIcon = (doc) => {
    const metadata = getMetadata(doc.metadata || doc.message?.metadata)
    const type = metadata.fileType || doc.message?.messageType || 'text'
    switch (type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />
      case 'video': return <Video className="h-5 w-5 text-purple-500" />
      case 'file': return <File className="h-5 w-5 text-gray-500" />
      default: return <FileText className="h-5 w-5 text-primary" />
    }
  }

  const getFileName = (doc) => {
    const metadata = getMetadata(doc.metadata || doc.message?.metadata)
    return doc.title || metadata.originalName || metadata.filename || doc.message?.content || 'Tài liệu không tiêu đề'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tài liệu đã ghim" size="lg">
      <div className="max-h-[50vh] lg:max-h-[60vh] overflow-y-auto -mx-4 lg:mx-0 px-4 lg:px-0">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Pin className="mb-3 h-10 w-10 lg:h-12 lg:w-12 text-text-secondary/50" />
            <p className="text-sm lg:text-base text-text-secondary">
              Chưa có tài liệu nào được ghim
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start gap-2 lg:gap-3 rounded-xl border border-border p-2 lg:p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <div className="rounded-lg bg-gray-100 p-2 shrink-0">
                  {getFileIcon(doc)}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-text-primary text-sm lg:text-base">
                    {getFileName(doc)}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 lg:gap-2 text-xs text-text-secondary">
                    <Avatar
                      src={doc.pinnedBy?.avatarUrl}
                      name={doc.pinnedBy?.displayName || doc.pinnedBy?.username}
                      size="sm"
                      className="w-5 h-5 lg:w-6 lg:h-6"
                    />
                    <span className="truncate max-w-[80px] lg:max-w-none">
                      {doc.pinnedBy?.displayName}
                    </span>
                    <span className="hidden lg:inline">-</span>
                    <span className="hidden lg:inline">{formatRelativeTime(doc.pinnedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => doc.message && onViewMessage(doc.message)}
                    title="Xem tin nhắn"
                    className="h-8 w-8 lg:h-9 lg:w-9"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUnpin(doc)}
                    title="Bỏ ghim"
                    className="h-8 w-8 lg:h-9 lg:w-9"
                  >
                    <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
