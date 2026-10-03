import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiX, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useOrganizationGallery, useUploadGalleryItem, useDeleteGalleryItem } from '@/features/organization/hooks/useOrganization'
import { GALLERY_CATEGORIES } from '@/features/organization/constants'
import { pageTransition, staggerContainer, staggerItem } from '@/animations'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import { extractList, getPagination } from '@/lib/pagination'
interface GalleryItem {
  _id: string
  url: string
  type: string
  caption?: string
  category?: string
}

export default function OrganizationGalleryPage() {
  const { id } = useParams<{ id: string }>()
  const [activeCategory, setActiveCategory] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState('image')
  const [page, setPage] = useState(1)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrganizationGallery(id || '')
  const uploadMutation = useUploadGalleryItem(id || '')
  const deleteMutation = useDeleteGalleryItem(id || '')

  const galleryItems = data?.pages?.flatMap(p => extractList<GalleryItem>(p)) ?? []
  const totalPages = getPagination(data?.pages?.[0])?.totalPages || 1

  const filteredItems = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory || item.type === activeCategory)

  const handlePageChange = (next: number) => {
    setPage(next)
    if (next > (data?.pages?.length ?? 1) && hasNextPage) {
      void fetchNextPage()
    }
  }

  const handleUpload = () => {
    if (!uploadFile) return
    uploadMutation.mutate({ file: uploadFile, type: uploadType }, {
      onSuccess: () => {
        toast.success('File uploaded successfully')
        setShowUpload(false)
        setUploadFile(null)
      },
      onError: () => toast.error('Failed to upload file'),
    })
  }

  const handleDelete = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    deleteMutation.mutate(itemId, {
      onSuccess: () => {
        toast.success('Item deleted')
        setSelectedImage(null)
      },
      onError: () => toast.error('Failed to delete item'),
    })
  }

  return (
    <motion.div {...pageTransition} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Gallery</h2>
        <Button size="sm" leftIcon={<FiUpload size={14} />} onClick={() => setShowUpload(true)}>Upload</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip selected={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</Chip>
        {GALLERY_CATEGORIES.map(cat => (
          <Chip key={cat.value} selected={activeCategory === cat.value} onClick={() => setActiveCategory(cat.value)}>{cat.label}</Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-8 text-center">
          <FiImage className="mx-auto mb-2 text-[var(--color-text-muted)]" size={32} />
          <p className="text-sm text-[var(--color-text-muted)]">No gallery items yet.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map(item => (
            <motion.div key={item._id} variants={staggerItem}>
              <button
                onClick={() => setSelectedImage(item.url)}
                className="aspect-square w-full rounded-xl overflow-hidden border border-[var(--color-border-primary)] hover:shadow-md transition-shadow"
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.caption || ''} className="h-full w-full object-cover" />
                )}
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-6"
        />
      )}
      {isFetchingNextPage && (
        <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">Loading more…</p>
      )}

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} size="full">
        {selectedImage && (
          <div className="relative">
            <img src={selectedImage} alt="" className="max-h-[80vh] w-full object-contain rounded-lg" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={() => setSelectedImage(null)} className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70">
                <FiX size={20} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setUploadFile(null) }} title="Upload to Gallery" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {GALLERY_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setUploadType(cat.value)}
                className={`rounded-lg border p-3 text-sm font-medium text-center transition-colors ${
                  uploadType === cat.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="rounded-lg border-2 border-dashed border-[var(--color-border-primary)] p-8 text-center">
            <input
              type="file"
              accept={uploadType === 'video' ? 'video/*' : uploadType === 'image' ? 'image/*' : '*'}
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="hidden"
              id="gallery-upload"
            />
            <label htmlFor="gallery-upload" className="cursor-pointer">
              <FiUpload className="mx-auto mb-2 text-[var(--color-text-muted)]" size={24} />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {uploadFile ? uploadFile.name : 'Click to select a file'}
              </p>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowUpload(false); setUploadFile(null) }}>Cancel</Button>
            <Button onClick={handleUpload} isLoading={uploadMutation.isPending} disabled={!uploadFile}>Upload</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
