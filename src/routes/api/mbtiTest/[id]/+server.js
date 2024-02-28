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
	// MBTI 테스트 상세 조회 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const { id } = params

		const { data, error } = await supabase.from('mbti_tests').select().eq('id', id).single()

		if (error) {
			throw { status: 404, message: '해당 테스트를 찾을 수 없습니다.', error }
		}

		const { data: questionsData, error: questionsError } = await supabase
			.from('mbti_questions')
			.select()
			.eq('test_id', id)

		if (questionsError) {
			throw {
				status: 404,
				message: '해당 테스트의 문제를 찾을 수 없습니다.',
				error: questionsError
			}
		}

		// 문제들을 set_id 별로 그룹화
		const groupedQuestions = questionsData.reduce((acc, question) => {
			if (!acc[question.set_id]) {
				acc[question.set_id] = []
			}
			acc[question.set_id].push(question)
			return acc
		}, {})

		// 객체를 배열로 변환
		const questionsBySet = Object.values(groupedQuestions)

		const { data: typesData, error: typesError } = await supabase
			.from('mbti_types')
			.select()
			.eq('test_id', id)

		if (typesError) {
			throw {
				status: 404,
				message: '해당 테스트의 타입을 찾을 수 없습니다.',
				error: typesError
			}
		}

		return json(
			{
				message: '테스트 상세 조회를 성공했습니다.',
				data: { ...data, questions: questionsBySet, types: typesData },
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
	// MBTI 테스트 수정 API
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
		const type_category = formData.get('type_category')
		const types = JSON.parse(formData.get('types'))
		const questions = JSON.parse(formData.get('questions'))

		// 유효성 검사
		if (!title || !sub_title || !description || !type_category || !types || !questions) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
		}

		// 데이터베이스에서 현재 테스트의 img_url 조회
		const { data: testData, error: testError } = await supabase
			.from('mbti_tests')
			.select('img_url')
			.eq('id', id)
			.single()

		if (testError || !testData) {
			throw { status: 404, message: '테스트 이미지를 찾을 수 없습니다.' }
		}

		const currentImgUrl = testData.img_url

		let img_path = ''

		// 이미지 파일이 제공되었는지 확인
		if (imgFile && typeof imgFile !== 'string') {
			// imgFile이 파일 객체인 경우
			// 기존 이미지 삭제 로직
			if (oldImageUrl) {
				// oldImageUrl 존재 여부만 확인
				const existingImgPath = oldImageUrl.replace('admin_dashboard_bucket/', '')

				if (existingImgPath) {
					const { error: deleteError } = await supabase.storage
						.from('admin_dashboard_bucket')
						.remove([existingImgPath])

					if (deleteError) {
						console.error('기존 이미지 삭제 실패:', deleteError)
						throw { status: 400, message: '기존 이미지 삭제 실패', error: deleteError }
					}
				}
			}

			// 새 이미지 업로드 로직
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

			img_path = imgUploadData.fullPath // 새 이미지 경로로 업데이트
		} else {
			// 이미지 변경 없음: 기존 이미지 URL을 그대로 사용
			img_path = currentImgUrl
		}

		// 테스트 정보 수정
		const { data, error } = await supabase
			.from('mbti_tests')
			.update({
				title: title,
				sub_title: sub_title,
				description: description,
				img_url: img_path,
				type_category: type_category,
				updated_at: new Date()
			})
			.eq('id', id)
			.select()

		if (error) {
			console.error('테스트 정보 수정 실패:', error)
			throw { status: 400, message: '테스트 정보 수정 실패', error: error }
		}

		const testId = data[0].id

		// 타입 정보 수정
		await Promise.all(
			types.map(async (type) => {
				if (type.id) {
					// 기존 타입 업데이트
					const { error: updateError } = await supabase
						.from('mbti_types')
						.update({
							test_id: testId, // 이전에 수정된 테스트의 ID
							type: type.type,
							description: type.description
						})
						.eq('id', type.id)

					if (updateError) {
						throw { status: 400, message: '타입 정보 수정 실패', error: updateError }
					}
				} else {
					// 새 타입 추가
					const { error: insertError } = await supabase.from('mbti_types').insert([
						{
							test_id: testId, // 이전에 수정된 테스트의 ID
							type: type.type,
							description: type.description
						}
					])

					if (insertError) {
						throw { status: 400, message: '새 타입 추가 실패', error: insertError }
					}
				}
			})
		)

		// 질문 정보 수정
		const flatQuestions = questions.flat() // 2차원 배열을 1차원 배열로 평탄화
		let maxSetId = await supabase
			.from('mbti_questions')
			.select('set_id')
			.order('set_id', { ascending: false })
			.limit(1)
		maxSetId = maxSetId.data[0]?.set_id || 0 // 기존 최대 set_id 조회, 없으면 0

		await Promise.all(
			flatQuestions.map(async (question, index) => {
				if (question.id) {
					// 기존 질문 업데이트
					const { error: updateError } = await supabase
						.from('mbti_questions')
						.update({
							content: question.content,
							types: question.types
							// set_id 업데이트가 필요한 경우 로직 추가
						})
						.eq('id', question.id)

					if (updateError) {
						throw { status: 400, message: '질문 정보 수정 실패', error: updateError }
					}
				} else {
					// 새 질문 추가
					// 새 질문의 경우, set_id는 질문 세트의 순서에 따라 결정
					const newSetId = Math.ceil((index + 1) / 2) + maxSetId // 예: 2개 질문이 한 세트이므로, index를 사용하여 set_id 계산

					const { error: insertError } = await supabase.from('mbti_questions').insert([
						{
							test_id: testId,
							content: question.content,
							types: question.types,
							set_id: newSetId
						}
					])

					if (insertError) {
						throw { status: 400, message: '새 질문 추가 실패', error: insertError }
					}
				}
			})
		)

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
