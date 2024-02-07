import { writable } from 'svelte/store'
import useApi from '../util/api'

const { httpPost, endPoints } = useApi()

export const isAuthenticated = writable(false) // 인증 상태
export const accessToken = writable(null) // 엑세스 토큰 저장용

// 로그인 성공 시 Store 업데이트
export function loginSuccess(token) {
	isAuthenticated.set(true)
	accessToken.set(token)
}

// 로그아웃 시 Store 초기화
export function logout() {
	isAuthenticated.set(false)
	accessToken.set(null)
}

// Refresh Token을 사용하여 새로운 Access Token을 요청하고 업데이트하는 함수
export async function refreshToken() {
	const newToken = await fetchNewAccessToken()
	accessToken.set(newToken)
}

// 새로운 Access Token 요청
async function fetchNewAccessToken() {
	const response = await fetch('/api/refresh-token', { method: 'POST' })
	const data = await response.json()
	return data.accessToken
}
