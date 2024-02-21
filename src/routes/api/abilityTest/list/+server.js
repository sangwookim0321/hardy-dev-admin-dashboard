import { sql } from '@vercel/postgres'
import { supabase } from '$lib/util/supabaseClient'
import { json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

async function checkAdminPermission(authHeader) {
	if (!authHeader) {
		console.error('인증 토큰이 없습니다.')
		throw { status: 401, message: '인증 토큰이 없습니다.' }
	}

	try {
		const token = authHeader.split(' ')[1]
		const decoded = jwt.verify(token, import.meta.env.VITE_APP_JWT_SECRET)
		const userId = decoded.id

		const result = await sql`SELECT * FROM accounts WHERE id = ${userId}`
		const user = result.rows[0]

		if (!user) {
			console.error('사용자를 찾을 수 없습니다.')
			throw { status: 404, message: '사용자를 찾을 수 없습니다.' }
		}

		if (user.role !== 1) {
			console.error('권한이 없습니다.')
			throw { status: 403, message: '권한이 없습니다.' }
		}
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			console.error('JWT 처리 중 오류 발생:', err)
			throw { status: 401, message: '유효하지 않은 토큰입니다.' }
		} else {
			throw err
		}
	}
}

export async function GET({ request }) {
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const url = new URL(request.url)

		const creation_date = url.searchParams.get('creation_date') // 최신순, 오래된순
		const views = url.searchParams.get('views') // 높은순, 낮은순
		const disclosure = url.searchParams.get('disclosure') // 공개, 비공개
		const search = url.searchParams.get('search') // 검색어(ID, 이름)
		const page = url.searchParams.get('page') || 1 // 페이지
		const limit = url.searchParams.get('limit') || 5 // 페이지당 표시할 개수
		const offset = (page - 1) * limit

		console.log(creation_date, views, disclosure, search, page, limit, offset)

		let query = supabase.from('ability_tests').select('*', { count: 'exact' })

		// 검색어 적용
		if (search) {
			query = query.ilike('id', `%${search}%`).or(`title.ilike.%${search}%`)
		}

		// 공개/비공개 필터
		if (disclosure) {
			query = query.eq('release', disclosure === '공개')
		}

		// 정렬
		if (creation_date) {
			query = query.order('created_at', { ascending: creation_date === '오래된순' })
		}
		if (views) {
			query = query.order('count', { ascending: views === '높은순' })
		}

		// 결과 조회
		const { data, error, count } = await query.range(offset, offset + limit - 1)

		if (error) {
			throw { status: 400, message: '테스트 정보 조회 실패', error }
		}

		return json(
			{
				data: data,
				message: '테스트 목록을 성공적으로 조회했습니다.',
				status: 200,
				page,
				limit,
				total: count
			},
			{ status: 200 }
		)
	} catch (err) {
		console.error('서버 오류:', err)
		return json(
			{
				message: `${err.message}`,
				status: err.status || 400,
				error: err.error || '서버 오류'
			},
			{ status: err.status || 500 }
		)
	}
}
