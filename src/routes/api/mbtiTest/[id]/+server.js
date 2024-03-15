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

		const { data, error } = await supabase
			.from('mbti_tests')
			.select()
			.eq('id', id)
			.single()
			.order('id', { ascending: true })

		if (error) {
			throw { status: 404, message: '해당 테스트를 찾을 수 없습니다.', error }
		}

		const { data: setQuestionsData, error: setQuestionsError } = await supabase
			.from('mbti_question_sets')
			.select()
			.eq('test_id', id)
			.order('id', { ascending: true })

		if (setQuestionsError) {
			throw {
				status: 404,
				message: '해당 테스트의 질문 세트를 찾을 수 없습니다.',
				error: setQuestionsError
			}
		}

		const { data: questionsData, error: questionsError } = await supabase
			.from('mbti_questions')
			.select()
			.eq('test_id', id)
			.order('id', { ascending: true })

		if (questionsError) {
			throw {
				status: 404,
				message: '해당 테스트의 질문을 찾을 수 없습니다.',
				error: questionsError
			}
		}

		const questionsBySet = setQuestionsData.map((set) => {
			const setQuestions = questionsData.filter((question) => question.set_id === set.id)
			return { ...set, setQuestions: setQuestions }
		})

		const { data: typesData, error: typesError } = await supabase
			.from('mbti_types')
			.select()
			.eq('test_id', id)
			.order('id', { ascending: true })

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
		const deleteTypeList = JSON.parse(formData.get('deleteTypeList'))
		const deleteList = JSON.parse(formData.get('deleteList'))
		let main_img_path = ''

		// 유효성 검사
		if (!title || !sub_title || !description || !type_category || !types || !questions) {
			throw { status: 400, message: '모든 필드를 채워주세요.' }
		}

		if (imgFile && imgFile instanceof File) {
			// 이미지 파일이 있는 경우, 메인 이미지 변경으로 간주
			const existingImage = oldImageUrl.replace('admin_dashboard_bucket/', '')

			const { error: mainImgDeleteError } = await supabase.storage
				.from('admin_dashboard_bucket')
				.remove([existingImage])

			if (mainImgDeleteError) {
				throw {
					status: 400,
					message: '기존 메인 이미지 삭제에 실패했습니다.',
					error: mainImgDeleteError
				}
			}

			const { data: imgUploadData, error: imgUploadError } = await supabase.storage
				.from('admin_dashboard_bucket')
				.upload(`mbtiTest-images/${Date.now()}_${imgFile.name}`, imgFile, {
					cacheControl: '3600',
					upsert: false
				})

			if (imgUploadError) {
				throw {
					status: 400,
					message: '새로운 메인 이미지 업로드에 실패했습니다.',
					error: imgUploadError
				}
			}

			main_img_path = imgUploadData.fullPath
		} else {
			// 이미지 파일이 없는 경우, 메인 이미지 변경이 아닌 경우로 간주
			main_img_path = oldImageUrl
		}

		const { data, error } = await supabase
			.from('mbti_tests')
			.update({
				title,
				sub_title,
				description,
				type_category,
				img_url: main_img_path,
				updated_at: new Date()
			})
			.eq('id', id)

		if (error) {
			throw { status: 400, message: '테스트 수정에 실패했습니다.', error }
		}

		// -----------------------------------------------------------------------------------

		// 타입 정보 수정
		await Promise.all(
			types.map(async (type) => {
				if (type.id) {
					// 기존 타입 업데이트
					const { error: updateError } = await supabase
						.from('mbti_types')
						.update({
							test_id: id,
							type: type.type,
							description: type.description
						})
						.eq('id', type.id)

					if (updateError) {
						throw { status: 400, message: '타입 정보 수정 실패', error: updateError }
					}
				} else {
					// 새 타입 추가
					const { error: typeInsertError } = await supabase.from('mbti_types').insert([
						{
							test_id: id,
							type: type.type,
							description: type.description
						}
					])

					if (typeInsertError) {
						throw { status: 400, message: '새 타입 추가 실패', error: typeInsertError }
					}
				}
			})
		)

		// -----------------------------------------------------------------------------------

		// 질문 정보 수정

		await Promise.all(
			questions.map(async (item, index) => {
				const fileKey = `sub_img_url_${index}`
				const file = formData.get(fileKey)
				let sub_img_path = ''

				if (item.isNew) {
					// 신규 추가된 질문건
					if (file && file instanceof File) {
						const { data: imgUploadData, error: imgUploadError } = await supabase.storage
							.from('admin_dashboard_bucket')
							.upload(`mbtiTest-sub-images/${Date.now()}_${file.name}`, file, {
								cacheControl: '3600',
								upsert: false
							})

						if (imgUploadError) {
							throw {
								status: 400,
								message: '질문 이미지 업로드에 실패했습니다.',
								error: imgUploadError
							}
						}

						sub_img_path = imgUploadData.fullPath
					}

					const { data: setQuestionData, error: setQuestionError } = await supabase
						.from('mbti_question_sets')
						.insert({
							test_id: id,
							content: item.content,
							sub_img_url: sub_img_path
						})
						.select('id')

					if (setQuestionError) {
						throw { status: 400, message: '질문 추가에 실패했습니다.', error: setQuestionError }
					}

					// 질문에 대한 선택지 추가
					await Promise.all(
						item.setQuestions.map(async (setQuestion) => {
							const { data: questionData, error: questionError } = await supabase
								.from('mbti_questions')
								.insert({
									set_id: setQuestionData[0].id,
									set_content: setQuestion.set_content,
									types: setQuestion.types
								})

							if (questionError) {
								throw {
									status: 400,
									message: '질문 선택지 추가에 실패했습니다.',
									error: questionError
								}
							}
						})
					)
				} else if (item.id) {
					if (file && file instanceof File) {
						// 기존 질문에 대한 처리
						const existingSubImage = item.old_sub_img_url.replace('admin_dashboard_bucket/', '')

						const { error: subImgDeleteError } = await supabase.storage
							.from('admin_dashboard_bucket')
							.remove([existingSubImage])

						if (subImgDeleteError) {
							throw {
								status: 400,
								message: '기존 질문 이미지 삭제에 실패했습니다.',
								error: subImgDeleteError
							}
						}

						// 새 이미지 업로드
						const { data: imgUploadData, error: imgUploadError } = await supabase.storage
							.from('admin_dashboard_bucket')
							.upload(`mbtiTest-sub-images/${Date.now()}_${file.name}`, file, {
								cacheControl: '3600',
								upsert: false
							})

						if (imgUploadError) {
							throw {
								status: 400,
								message: '새로운 질문 이미지 업로드에 실패했습니다.',
								error: imgUploadError
							}
						}

						sub_img_path = imgUploadData.fullPath
					} else if (item.isImageDeleted && item.old_sub_img_url) {
						// 이미지 삭제 경우: 기존 이미지 삭제
						const existingSubImage = item.old_sub_img_url.replace('admin_dashboard_bucket/', '')
						await supabase.storage.from('admin_dashboard_bucket').remove([existingSubImage])
						sub_img_path = ''
					} else {
						// 이미지 그대로 유지: 기존 이미지 경로 사용
						sub_img_path = item.old_sub_img_url
					}

					// 질문 업데이트 로직 (sub_img_path를 포함하여 질문 정보 업데이트)
					const { data: setQuestionUpdate, error: setQuestionUpdateError } = await supabase
						.from('mbti_question_sets')
						.update({
							content: item.content,
							sub_img_url: sub_img_path
						})
						.eq('id', item.id)
						.select('id')

					if (setQuestionUpdateError) {
						throw {
							status: 400,
							message: '질문 수정에 실패했습니다.',
							error: setQuestionUpdateError
						}
					}

					// 질문 선택지 업데이트
					await Promise.all(
						item.setQuestions.map(async (setQuestion) => {
							if (setQuestion.id) {
								// 기존 선택지 업데이트
								const { error: updateError } = await supabase
									.from('mbti_questions')
									.update({
										set_content: setQuestion.set_content,
										types: setQuestion.types
									})
									.eq('id', setQuestion.id)

								if (updateError) {
									throw {
										status: 400,
										message: '질문 선택지 수정 실패',
										error: updateError
									}
								}
							}
						})
					)
				}
			})
		)

		// -----------------------------------------------------------------------------------

		// 삭제할 타입 처리

		if (deleteTypeList && deleteTypeList.length > 0) {
			await Promise.all(
				deleteTypeList.map(async (id) => {
					// 타입 레코드 삭제
					const { error: typeDeleteError } = await supabase.from('mbti_types').delete().eq('id', id)

					if (typeDeleteError) {
						throw { status: 400, message: '타입 삭제에 실패했습니다.', error: typeDeleteError }
					}
				})
			)
		}

		// 삭제할 질문 처리

		if (deleteList && deleteList.length > 0) {
			await Promise.all(
				deleteList.map(async (id) => {
					// 먼저 삭제할 질문의 sub_img_url을 조회
					const { data: question, error: questionFetchError } = await supabase
						.from('mbti_question_sets')
						.select('sub_img_url')
						.eq('id', id)
						.single()

					if (questionFetchError) {
						throw {
							status: 400,
							message: '삭제할 질문을 찾는 데 실패했습니다.',
							error: questionFetchError
						}
					}

					// 질문에 연결된 이미지가 있으면 스토리지에서 삭제
					if (question.sub_img_url) {
						const existingSubImage = question.sub_img_url.replace('admin_dashboard_bucket/', '')
						const { error: subImgDeleteError } = await supabase.storage
							.from('admin_dashboard_bucket')
							.remove([existingSubImage])

						if (subImgDeleteError) {
							throw {
								status: 400,
								message: '질문의 이미지 삭제에 실패했습니다.',
								error: subImgDeleteError
							}
						}
					}

					// 질문 레코드 삭제
					const { error: questionDeleteError } = await supabase
						.from('mbti_questions')
						.delete()
						.eq('set_id', id)

					if (questionDeleteError) {
						throw { status: 400, message: '질문 삭제에 실패했습니다.', error: questionDeleteError }
					}

					// 질문 세트 레코드 삭제
					const { error: setDeleteError } = await supabase
						.from('mbti_question_sets')
						.delete()
						.eq('id', id)

					if (setDeleteError) {
						throw { status: 400, message: '질문 세트 삭제에 실패했습니다.', error: setDeleteError }
					}
				})
			)
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
