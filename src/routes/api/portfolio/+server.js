import { sql } from '@vercel/postgres'
import { supabase } from '$lib/util/supabaseClient'
import { json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

const superAdmin = 1 // ALL
const normalAdmin = 2 // HTTP Method
const superOperator = 3 // GET
const nomalOperator = 4 // Specific API

async function checkAdminPermission(authHeader, requiredRole) {
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

	if (user.role === 1) {
		return
	}

	if (user.role > requiredRole) {
		throw { status: 403, message: '권한이 없습니다.' }
	}
}

export async function GET({ request }) {
	// 포트폴리오 더미데이터 조회 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader, superAdmin)

		const { data, error } = await supabase.from('portfolios').select('*')

		if (error) {
			throw {
				status: 404,
				message: '포트폴리오 데이터 조회에 실패했습니다.',
				error: error
			}
		}

		return json(
			{
				data: data,
				message: '포트폴리오 데이터 조회에 성공했습니다.',
				status: 200
			},
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

export async function POST({ request }) {
	// 포트폴리오 더미데이터 등록 API
	const authHeader = request.headers.get('authorization')
	let requestData

	try {
		await checkAdminPermission(authHeader, superAdmin)
		requestData = await request.json()

		const { data, error } = await supabase
			.from('portfolios')
			.insert({ content: requestData.content, type: requestData.selectedType })

		if (error) {
			throw {
				status: 404,
				message: '포트폴리오 데이터 등록에 실패했습니다.',
				error: error
			}
		}

		return json(
			{
				data: data,
				message: '포트폴리오 데이터 등록에 성공했습니다.',
				status: 200
			},
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
	// 포트폴리오 더미 데이터  삭제 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader, superAdmin)

		const url = new URL(request.url)
		const type = url.searchParams.get('type')

		const { error } = await supabase.from('portfolios').delete().eq('type', type)

		if (error) {
			console.error('포트폴리오 데이터 삭제 실패:', error)
			throw { status: 400, message: '포트폴리오 데이터 삭제 실패', error }
		}

		return json({ message: '포트폴리오 데이터 삭제 성공', status: 200 }, { status: 200 })
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
