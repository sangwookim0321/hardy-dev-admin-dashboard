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

export async function GET({ request, params }) {
	try {
		const { id } = params
		const { data, error } = await supabase.from('portfolios').select().eq('type', id).single()

		if (error) {
			throw { status: 404, message: '해당 데이터를 찾을 수 없습니다.', error }
		}

		return new Response(
			JSON.stringify({
				message: '포트폴리오 더미 데이터 상세 조회를 성공했습니다.',
				data: data,
				status: 200
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': 'https://portfolio-v1-nu-eosin.vercel.app'
				}
			}
		)
	} catch (err) {
		console.error('서버 오류:', err)
		return new Response(
			JSON.stringify({
				message: err.message,
				status: err.status || 400,
				error: err.error || '서버 오류'
			}),
			{
				status: err.status || 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': 'https://portfolio-v1-nu-eosin.vercel.app'
				}
			}
		)
	}
}

export async function PUT({ request, params }) {
	// 능력고사 테스트 수정 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const { id } = params

		const requestData = await request.json()

		if (!id) {
			throw { status: 400, message: '테스트 타입을 올바르게 보내주세요.' }
		}

		const { error } = await supabase
			.from('portfolios')
			.update({ type: requestData.selectedType, content: requestData.content })
			.eq('type', id)

		if (error) {
			throw { status: 404, message: '해당 데이터를 찾을 수 없습니다.', error }
		}

		return json(
			{
				message: '포트폴리오 더미 데이터 수정을 성공했습니다.',
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
