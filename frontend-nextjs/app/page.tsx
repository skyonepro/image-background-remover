'use client'

import { useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const handleRemoveBackground = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_API_URL || 'YOUR_WORKER_URL/remove-bg',
        formData,
        { responseType: 'blob' }
      )
      setResult(URL.createObjectURL(response.data))
    } catch (error) {
      alert('处理失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          🖼️ 背景移除工具
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-4 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition cursor-pointer"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-gray-600 text-lg">📁 点击或拖拽图片到这里</p>
          </div>

          {preview && (
            <button
              onClick={handleRemoveBackground}
              disabled={loading}
              className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? '处理中...' : '移除背景'}
            </button>
          )}

          {loading && (
            <div className="text-center mt-6 text-purple-600 font-medium">
              处理中，请稍候...
            </div>
          )}

          {(preview || result) && (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {preview && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">原图</h3>
                  <img src={preview} alt="原图" className="rounded-lg shadow-lg w-full" />
                </div>
              )}
              
              {result && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">处理后</h3>
                  <img src={result} alt="处理后" className="rounded-lg shadow-lg w-full" />
                  <a
                    href={result}
                    download="removed-bg.png"
                    className="mt-4 block text-center bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    下载图片
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
