import type { FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from './useAuth.ts'

export function AuthPanel() {
  const { isConfigured, isLoading, user, signIn, signOut, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('로그인하면 최고 점수와 누적 기록이 저장됩니다.')

  async function submitCredentials(mode: 'signin' | 'signup') {
    setIsSubmitting(true)
    const action = mode === 'signin' ? signIn : signUp
    const errorMessage = await action(email, password)

    if (errorMessage) {
      setMessage(errorMessage)
    } else if (mode === 'signup') {
      setMessage('회원가입 요청을 보냈습니다. 이메일 인증 설정을 확인해 주세요.')
      setPassword('')
    } else {
      setMessage('로그인되었습니다. 이제 게임 점수를 저장할 수 있습니다.')
      setPassword('')
    }

    setIsSubmitting(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitCredentials('signin')
  }

  async function handleSignOut() {
    setIsSubmitting(true)
    const errorMessage = await signOut()
    setMessage(errorMessage ?? '로그아웃했습니다. 게스트 모드로 플레이할 수 있습니다.')
    setIsSubmitting(false)
  }

  return (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <p className="eyebrow">Identity</p>
        <h2>Auth Gateway</h2>
      </div>

      {!isConfigured ? (
        <div className="empty-state">
          <p>Supabase 연결 정보가 아직 없습니다.</p>
          <p className="muted">.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가하세요.</p>
        </div>
      ) : isLoading ? (
        <div className="empty-state">
          <p>세션을 확인하는 중입니다...</p>
        </div>
      ) : user ? (
        <div className="account-card">
          <p className="account-label">현재 로그인</p>
          <strong>{user.email ?? user.id}</strong>
          <button className="ghost-button" type="button" onClick={handleSignOut} disabled={isSubmitting}>
            로그아웃
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pilot@example.com"
              required
            />
          </label>

          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="최소 6자 이상"
              minLength={6}
              required
            />
          </label>

          <div className="auth-actions">
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              로그인
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={isSubmitting || !email || password.length < 6}
              onClick={() => {
                void submitCredentials('signup')
              }}
            >
              회원가입
            </button>
          </div>
        </form>
      )}

      <p className="panel-message">{message}</p>
    </section>
  )
}