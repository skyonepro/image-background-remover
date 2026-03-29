'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// ====== Google OAuth 配置 ======
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

interface GoogleUser {
  name: string
  email: string
  picture: string
  sub: string
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (element: HTMLElement, config: object) => void
          disableAutoSelect: () => void
          revoke: (email: string, done: () => void) => void
        }
      }
    }
  }
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [googleReady, setGoogleReady] = useState(false)

  // 解析 Google JWT Token
  const parseJwt = (token: string): GoogleUser => {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  }

  // 保存用户到 D1
  const saveUserToDB = async (credential: string, userInfo: GoogleUser) => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
    } catch (e) {
      console.warn('Failed to save user to DB:', e)
    }
  }

  // 初始化 Google Sign-In
  const initGoogle = useCallback(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        const userInfo = parseJwt(response.credential)
        setUser(userInfo)
        localStorage.setItem('google_user', JSON.stringify(userInfo))
        saveUserToDB(response.credential, userInfo)
      },
      auto_select: false,
    })

    const btnEl = document.getElementById('google-signin-btn')
    if (btnEl) {
      window.google.accounts.id.renderButton(btnEl, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'zh-CN',
        width: 280,
      })
    }

    setGoogleReady(true)
  }, [])

  useEffect(() => {
    // 检查本地缓存的登录状态
    const saved = localStorage.getItem('google_user')
    if (saved) {
      setUser(JSON.parse(saved))
    }

    // 加载 Google Identity Services SDK
    if (document.getElementById('google-gsi-script')) {
      initGoogle()
      return
    }
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.head.appendChild(script)
  }, [initGoogle])

  // 登出
  const handleSignOut = () => {
    if (window.google && user) {
      window.google.accounts.id.disableAutoSelect()
    }
    setUser(null)
    localStorage.removeItem('google_user')
  }

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
    if (!user) {
      alert('请先登录后再使用')
      return
    }

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
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-white">
            🖼️ 背景移除工具
          </h1>

          {/* 登录区域 */}
          <div>
            {user ? (
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-9 h-9 rounded-full ring-2 ring-white"
                />
                <div className="text-white">
                  <p className="font-semibold text-sm leading-tight">{user.name}</p>
                  <p className="text-xs text-white/70">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-white/70 hover:text-white text-xs underline"
                >
                  退出
                </button>
              </div>
            ) : (
              <div>
                {/* Google 官方登录按钮容器 */}
                <div id="google-signin-btn" />
                {!googleReady && (
                  <div className="text-white/60 text-sm">加载中...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 主内容 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!user && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">👆 请先登录后使用</p>
              <p className="text-sm text-gray-400">使用 Google 账号一键登录，免费体验背景移除</p>
            </div>
          )}

          {user && (
            <>
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}
