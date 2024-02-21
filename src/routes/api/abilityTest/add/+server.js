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
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const formData = await request.formData()
		const title = formData.get('title')
		const sub_title = formData.get('sub_title')
		const description = formData.get('description')
		const imgFile = formData.get('img')
		const questions = JSON.parse(formData.get('questions'))

		// 유효성 검사
		if (!title || !sub_title || !description || !imgFile) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
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
		// 테스트 정보 저장
		const { data, error } = await supabase
			.from('ability_tests')
			.insert({
				title: title,
				sub_title: sub_title,
				description: description,
				img_url: img_path,
				release: false,
				created_at: new Date()
			})
			.select()

		if (error) {
			console.error('테스트 정보 저장 실패:', error)
			throw { status: 400, message: '테스트 정보 저장 실패', error: error }
		}

		const testId = data[0].id

		// 질문 정보 저장
		const questionsWithTestId = questions.map((question) => ({
			...question,
			test_id: testId
		}))

		const { error: questionsAddError } = await supabase
			.from('ability_questions')
			.insert(questionsWithTestId)

		if (questionsAddError) {
			console.error('질문 정보 저장 실패:', questionsAddError)
			throw { status: 400, message: '질문 정보 저장 실패', error: questionsAddError }
		}

		return json({ message: '테스트가 성공적으로 저장되었습니다.', status: 200 }, { status: 200 })
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
