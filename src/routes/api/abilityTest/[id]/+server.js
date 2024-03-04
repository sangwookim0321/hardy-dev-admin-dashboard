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
	// 능력고사 테스트 상세 조회 API
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
			.order('id', { ascending: true })

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

		// console.log(questions)

		// 유효성 검사
		if (!title || !sub_title || !description) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
		}

		// 데이터베이스에서 현재 테스트의 img_url 조회
		const { data: testData, error: testError } = await supabase
			.from('ability_tests')
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
				.upload(`abilityTest-images/${Date.now()}_${imgFile.name}`, imgFile, {
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

		// 질문 및 서브 이미지 처리
		await Promise.all(
			questions.map(async (question, index) => {
				const fileKey = `sub_img_url_${index}`
				const file = formData.get(fileKey)
				let subImgPath = question.sub_img_url
				console.log(question.old_sub_img_url)

				if (question.isDelete) {
					if (question.old_sub_img_url) {
						const oldPath = question.old_sub_img_url.replace('admin_dashboard_bucket/', '')
						await supabase.storage.from('admin_dashboard_bucket').remove([oldPath])
						subImgPath = null
					}
				} else if (file instanceof File) {
					// 새 이미지 업로드 로직
					const { data: uploadData, error: uploadError } = await supabase.storage
						.from('admin_dashboard_bucket')
						.upload(`abilityTest-sub-images/${Date.now()}_${file.name}`, file, {
							cacheControl: '3600',
							upsert: false
						})

					if (uploadError) {
						throw {
							status: 400,
							message: `질문 ${index + 1}의 이미지 업로드 실패`,
							error: uploadError
						}
					}

					subImgPath = uploadData.fullPath // 업로드된 이미지의 경로

					// 이전 이미지가 있으면 삭제
					if (question.old_sub_img_url) {
						const oldPath = question.old_sub_img_url.replace('admin_dashboard_bucket/', '')
						await supabase.storage.from('admin_dashboard_bucket').remove([oldPath])
					}
				}

				// 기존 질문 업데이트 또는 새 질문 추가
				if (question.id) {
					// 기존 질문 업데이트
					const { error: updateError } = await supabase
						.from('ability_questions')
						.update({
							question_etc: question.question_etc,
							question_list: question.question_list,
							question_name: question.question_name,
							question_number: question.question_number,
							answer: question.answer,
							score: question.score,
							sub_img_url: subImgPath, // 업로드된 새 이미지의 경로로 업데이트
							test_id: testId
						})
						.eq('id', question.id)

					if (updateError) {
						throw { status: 400, message: '질문 정보 업데이트 실패', error: updateError }
					}
				}
			})
		)

		// 새 질문 추가
		const newQuestions = questions
			.filter((q) => !q.id)
			.map((question) => ({
				...question,
				test_id: testId,
				// 새 이미지 업로드 로직에서 설정된 sub_img_url 사용
				sub_img_url: question.sub_img_url instanceof File ? img_path : question.sub_img_url
			}))

		// 새 질문이 있으면 데이터베이스에 추가
		if (newQuestions.length > 0) {
			const { error: insertError } = await supabase.from('ability_questions').insert(newQuestions)
			if (insertError) {
				throw { status: 400, message: '새 질문 추가 실패', error: insertError }
			}
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
