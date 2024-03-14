import { sql } from '@vercel/postgres'
import { supabase } from '$lib/util/supabaseClient'
import { json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

async function checkAdminPermission(authHeader) {
	if (!authHeader) {
		throw { status: 401, message: '인증 토큰이 없습니다.' }
	}

	const token = authHeader.split(' ')[1]
	const decoded = jwt.verify(token, import.meta.env.VITE_APP_JWT_SECRET)
	const userId = decoded.id

	const result = await sql`SELECT * FROM accounts WHERE id = ${userId}`
	const user = result.rows[0]

	if (!user) {
		throw { status: 404, message: '사용자를 찾을 수 없습니다.' }
	}

	if (user.role !== 1) {
		throw { status: 403, message: '권한이 없습니다.' }
	}
}

export async function GET({ request }) {
	const authHeader = request.headers.get('authorization')

	const url = new URL(request.url)
	const page = parseInt(url.searchParams.get('page') || 1) // 페이지
	const limit = parseInt(url.searchParams.get('limit') || 10) // 페이지당 표시할 개수
	const offset = (page - 1) * limit

	try {
		await checkAdminPermission(authHeader)

		const { error: testError, count: totalCount } = await supabase
			.from('ability_tests_result')
			.select('*', { count: 'exact' })

		if (testError) {
			console.error('테스트 결과 토탈 조회 실패:', testError)
			throw { status: 400, message: '테스트 결과 토탈 조회 실패', error: testError }
		}

		const { data, error, count } = await supabase
			.from('ability_tests_result')
			.select('*')
			.range(offset, offset + limit - 1)
			.order('created_at', { ascending: false })

		if (error) {
			if (error.code === 'PGRST103') {
				// 범위가 유효하지 않을 때 빈 데이터 배열과 함께 성공 메시지 반환
				return json(
					{ data: [], total: totalCount, message: '데이터가 더 이상 없습니다.', status: 200 },
					{ status: 200 }
				)
			} else {
				console.error('테스트 결과 조회 실패:', error)
				throw { status: 400, message: '테스트 결과 조회 실패', error }
			}
		}

		return json(
			{ data: data, total: totalCount, message: '테스트 결과 조회 성공', status: 200 },
			{ status: 200 }
		)
	} catch (err) {
		console.error('서버 오류:', err)
		return json(
			{
				message: err.message,
				status: err.status || 400,
				error: err.error || '서버 오류'
			},
			{ status: err.status || 500 }
		)
	}
}

export async function DELETE({ request }) {
	const authHeader = request.headers.get('authorization')

	const url = new URL(request.url)
	const id = url.searchParams.get('id')

	try {
		await checkAdminPermission(authHeader)

		const { error } = await supabase.from('ability_tests_result').delete().eq('id', id)

		if (error) {
			console.error('테스트 결과 아이템 삭제 실패:', error)
			throw { status: 400, message: '테스트 결과 아이템 삭제 실패', error }
		}

		return json({ message: '테스트 결과 아이템 삭제 성공', status: 200 }, { status: 200 })
	} catch (err) {
		console.error('서버 오류:', err)
		return json(
			{
				message: err.message,
				status: err.status || 400,
				error: err.error || '서버 오류'
			},
			{ status: err.status || 500 }
		)
	}
}
