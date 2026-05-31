import { useState, useEffect, useCallback } from 'react'
import { pinnedApi } from '@/api/index.js'

export const usePinnedDocs = (conversationId) => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDocuments = useCallback(async () => {
    if (!conversationId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await pinnedApi.getPinnedDocuments(conversationId)
      setDocuments(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pinned documents')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const pinDocument = async (messageId, title, description) => {
    if (!conversationId) return

    setError(null)
    try {
      const response = await pinnedApi.pinDocument(conversationId, {
        messageId,
        title,
        description,
      })
      setDocuments((prev) => [...prev, response.data])
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin document')
      throw err
    }
  }

  const unpinDocument = async (pinnedId) => {
    if (!conversationId) return
    setError(null)
    try {
      await pinnedApi.unpinDocument(conversationId, pinnedId)
      setDocuments((prev) => prev.filter((d) => d.id !== pinnedId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpin document')
      throw err
    }
  }

  const updateDocument = async (pinnedId, title, description) => {
    setError(null)
    try {
      const response = await pinnedApi.updatePinnedDocument(pinnedId, { title, description })
      setDocuments((prev) =>
        prev.map((d) => (d.id === pinnedId ? response.data : d))
      )
      return response.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pinned document')
      throw err
    }
  }

  const reorderDocuments = async (orderedIds) => {
    if (!conversationId) return

    setError(null)
    try {
      await pinnedApi.reorderPinnedDocuments(conversationId, orderedIds)
      setDocuments((prev) => {
        const orderedDocs = orderedIds
          .map((id) => prev.find((d) => d.id === id))
          .filter(Boolean)
        return orderedDocs
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder documents')
      throw err
    }
  }

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    pinDocument,
    unpinDocument,
    updateDocument,
    reorderDocuments,
  }
}
