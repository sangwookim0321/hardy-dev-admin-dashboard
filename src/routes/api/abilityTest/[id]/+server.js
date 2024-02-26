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
	// 테스트 상세 조회 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const { id } = params

		const { data, error } = await supabase.from('ability_tests').select().eq('id', id).single()

		if (error) {
			throw { status: 404, message: '해당 테스트를 찾을 수 없습니다.', error }
		}

		const { data: questionsData, error: questionsError } = await supabase
			.from('ability_questions')
			.select()
			.eq('test_id', id)

		if (questionsError) {
			throw {
				status: 404,
				message: '해당 테스트의 문제를 찾을 수 없습니다.',
				error: questionsError
			}
		}

		return json(
			{
				message: '테스트 상세 조회를 성공했습니다.',
				data: { ...data, questions: questionsData },
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

export async function PUT({ request, params }) {
	// 능력고사 테스트 수정 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const { id } = params

		if (!id) {
			throw { status: 400, message: '테스트 ID를 올바르게 보내주세요.' }
		}

		const formData = await request.formData()
		const title = formData.get('title')
		const sub_title = formData.get('sub_title')
		const description = formData.get('description')
		const imgFile = formData.get('img')
		const oldImageUrl = formData.get('oldImageUrl')
		const questions = JSON.parse(formData.get('questions'))

		// 유효성 검사
		if (!title || !sub_title || !description || !imgFile) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
		}

		// 기존 이미지 삭제
		const existingImgPath = oldImageUrl.replace('abilityTest-images/', '')

		if (existingImgPath) {
			const { error: deleteError } = await supabase.storage
				.from('abilityTest-images')
				.remove([existingImgPath])

			if (deleteError) {
				throw { status: 400, message: '기존 이미지 삭제 실패', error: deleteError }
			}
		}

		// 이미지 업로드
		const { data: imgUploadData, error: imgUploadError } = await supabase.storage
			.from('abilityTest-images')
			.upload(`images/${Date.now()}_${imgFile.name}`, imgFile, {
				cacheControl: '3600',
				upsert: false
			})

		if (imgUploadError) {
			console.error('이미지 업로드 실패:', imgUploadError)
			throw { status: 400, message: '이미지 업로드 실패', error: imgUploadError }
		}

		const img_path = imgUploadData.fullPath

		// 테스트 정보 수정
		const { data, error } = await supabase
			.from('ability_tests')
			.update({
				title: title,
				sub_title: sub_title,
				description: description,
				img_url: img_path,
				updated_at: new Date()
			})
			.eq('id', id)
			.select()

		if (error) {
			console.error('테스트 정보 수정 실패:', error)
			throw { status: 400, message: '테스트 정보 수정 실패', error: error }
		}

		const testId = data[0].id

		// 질문 정보 수정
		const questionsWithTestId = questions.map((question) => ({
			...question,
			test_id: testId
		}))

		const { error: questionsUpdateError } = await supabase
			.from('ability_questions')
			.upsert(questionsWithTestId)

		if (questionsUpdateError) {
			console.error('질문 정보 수정 실패:', questionsUpdateError)
			throw { status: 400, message: '질문 정보 수정 실패', error: questionsUpdateError }
		}

		return json({ message: '테스트가 성공적으로 수정되었습니다.', status: 200 }, { status: 200 })
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
