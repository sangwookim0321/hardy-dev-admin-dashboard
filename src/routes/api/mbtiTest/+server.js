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

export async function POST({ request }) {
	// MBTI 테스트 등록 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const formData = await request.formData()
		const title = formData.get('title')
		const sub_title = formData.get('sub_title')
		const description = formData.get('description')
		const imgFile = formData.get('img')
		const type_category = formData.get('type_category')
		const types = JSON.parse(formData.get('types'))
		const questions = JSON.parse(formData.get('questions'))

		// 유효성 검사
		if (
			!title ||
			!sub_title ||
			!description ||
			!imgFile ||
			!type_category ||
			!types ||
			!questions
		) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
		}

		// 이미지 업로드
		const { data: imgUploadData, error: imgUploadError } = await supabase.storage
			.from('admin_dashboard_bucket')
			.upload(`mbtiTest-images/${Date.now()}_${imgFile.name}`, imgFile, {
				cacheControl: '3600',
				upsert: false
			})

		if (imgUploadError) {
			console.error('이미지 업로드 실패:', imgUploadError)
			throw { status: 400, message: '이미지 업로드 실패', error: imgUploadError }
		}

		const img_path = imgUploadData.fullPath
		// 테스트 정보 저장
		const { data, error } = await supabase
			.from('mbti_tests')
			.insert({
				title: title,
				sub_title: sub_title,
				description: description,
				img_url: img_path,
				type_category: type_category,
				release: false,
				created_at: new Date()
			})
			.select()

		if (error) {
			console.error('테스트 정보 저장 실패:', error)
			throw { status: 400, message: '테스트 정보 저장 실패', error: error }
		}

		const testId = data[0].id

		const typesData = types.map(({ type, description }) => ({
			test_id: testId,
			type: type,
			description: description
		}))

		const { error: typesError } = await supabase.from('mbti_types').insert(typesData)

		if (typesError) {
			console.error('MBTI 타입 정보 저장 실패:', typesError)
			throw { status: 400, message: 'MBTI 타입 정보 저장 실패', error: typesError }
		}

		let setIndex = 1
		const questionData = []

		for (const questionSet of questions) {
			for (const question of questionSet) {
				questionData.push({
					test_id: data[0].id, // 테스트 ID
					content: question.content, // 질문 내용
					types: question.types, // 질문 유형
					set_id: setIndex // 세트 ID
				})
			}
			setIndex++ // 다음 세트로 넘어갈 때 인덱스 증가
		}

		const { error: questionsError } = await supabase.from('mbti_questions').insert(questionData)

		if (questionsError) {
			console.error('MBTI 질문 정보 저장 실패:', questionsError)
			throw { status: 400, message: 'MBTI 질문 정보 저장 실패', error: questionsError }
		}

		return json({ message: '테스트가 성공적으로 저장되었습니다.', status: 200 }, { status: 200 })
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
