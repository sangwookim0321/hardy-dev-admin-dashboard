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

	if (user.role === 1) {
		return
	}

	if (user.role > requiredRole) {
		throw { status: 403, message: '권한이 없습니다.' }
	}
}

export async function GET({ request }) {
	// MBTI 테스트 목록 조회 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader, superOperator)

		const url = new URL(request.url)

		const creation_date = url.searchParams.get('creation_date') // 최신순, 오래된순
		const views = url.searchParams.get('views') // 높은순, 낮은순
		const disclosure = url.searchParams.get('disclosure') // 공개, 비공개
		const search = url.searchParams.get('search') // 검색어(ID, 이름)
		const page = parseInt(url.searchParams.get('page') || 1) // 페이지
		const limit = parseInt(url.searchParams.get('limit') || 5) // 페이지당 표시할 개수
		const offset = (page - 1) * limit

		let query = supabase.from('mbti_tests').select('*', { count: 'exact' })

		// 검색어 적용
		if (search) {
			const searchId = parseInt(search, 10) // 검색어를 정수로 변환
			if (!isNaN(searchId)) {
				// 변환된 값이 유효한 숫자인 경우
				query = query.or(`id.eq.${searchId}`) // 'id' 필드와 직접 비교
			} else {
				query = query.ilike('title', `%${search}%`) // 'title'과 같은 문자열 필드에 대해 ilike 사용
			}
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
			query = query.order('views', { ascending: views === '높은순' })
		} else {
			query = query.order('created_at', { ascending: true })
		}

		// 결과 조회
		const { data, error, count } = await query.range(offset, offset + limit - 1)

		if (error) {
			console.error('MBTI 테스트 목록 조회 실패:', error)
			throw { status: 400, message: 'MBTI 테스트 목록 조회 실패', error: error }
		}

		// 집계 데이터 조회
		const { data: totalData, error: totalDataError } = await supabase.from('mbti_total').select('*')

		if (totalDataError) {
			console.error('MBTI 테스트 집계 데이터 조회 실패:', totalDataError)
			throw { status: 400, message: 'MBTI 테스트 집계 데이터 조회 실패', error: totalDataError }
		}

		return json({
			totalData,
			data: data,
			message: '테스트 목록을 성공적으로 조회했습니다.',
			status: 200,
			page,
			limit,
			total: count
		})
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
	// MBTI 테스트 등록 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader, normalAdmin)

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

		// 메인 이미지 업로드
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

		await Promise.all(
			questions.map(async (question, index) => {
				const file = formData.get(`sub_img_url_${index}`)
				if (file) {
					const { data: subImgUploadData, error: subImgUploadError } = await supabase.storage
						.from('admin_dashboard_bucket')
						.upload(`mbtiTest-sub-images/${Date.now()}_${file.name}`, file, {
							cacheControl: '3600',
							upsert: false
						})

					if (subImgUploadError) {
						throw {
							status: 400,
							message: `질문 ${index + 1}의 이미지 업로드 실패`,
							error: subImgUploadError
						}
					}

					question.sub_img_url = subImgUploadData.fullPath
				}
			})
		)

		const mapSetQuestions = questions.map((question, index) => ({
			test_id: testId,
			content: question.content,
			sub_img_url: question.sub_img_url
		}))

		const { data: questionSetsData, error: questionSetsError } = await supabase
			.from('mbti_question_sets')
			.insert(mapSetQuestions)
			.select()

		if (questionSetsError) {
			console.error('MBTI 질문 세트 정보 저장 실패:', questionSetsError)
			throw { status: 400, message: 'MBTI 질문 세트 정보 저장 실패', error: questionSetsError }
		}

		const mapQuestions = questions
			.map((question, index) => {
				const set_id = questionSetsData[index].id
				return question.setQuestions.map((setQuestion) => ({
					test_id: testId,
					set_id: set_id,
					set_content: setQuestion.set_content,
					types: setQuestion.types
				}))
			})
			.flat()

		const { error: questionsError } = await supabase.from('mbti_questions').insert(mapQuestions)

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

export async function PATCH({ request }) {
	// MBTI 테스트 공개상태 변경 API
	const authHeader = request.headers.get('authorization')

	const { id, release } = await request.json()

	if (!id || typeof release !== 'boolean') {
		return json(
			{ message: '테스트 ID 또는 release 상태를 올바르게 보내주세요.', status: 400 },
			{ status: 400 }
		)
	}

	try {
		await checkAdminPermission(authHeader, normalAdmin)

		const { error } = await supabase.from('mbti_tests').update({ release: !release }).eq('id', id)

		if (error) {
			console.error('테스트 공개상태 변경 실패:', error)
			throw { status: 400, message: '테스트 공개상태 변경 실패', error }
		}

		return json(
			{ message: '테스트 공개상태가 성공적으로 변경되었습니다.', status: 200 },
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
	// MBTI 테스트 삭제 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader, normalAdmin)

		const { ids, oldImagePaths } = await request.json()

		if (ids.length === 0) {
			return json({ message: '삭제할 테스트 ID를 보내주세요.', status: 400 }, { status: 400 })
		}

		if (oldImagePaths.length === 0) {
			return json({ message: '삭제할 이미지 경로를 보내주세요.', status: 400 }, { status: 400 })
		}

		const { data: questions, error: questionsError } = await supabase
			.from('mbti_question_sets')
			.select('sub_img_url')
			.in('test_id', ids)

		if (questionsError) {
			console.error('서브 이미지 URL 조회 실패:', questionsError)
			throw { status: 400, message: '서브 이미지 URL 조회 실패', error: questionsError }
		}

		const subImgUrls = questions.map((q) => q.sub_img_url).filter((url) => url)
		const existingSubImgPaths = subImgUrls.map((url) => url.replace('admin_dashboard_bucket/', ''))
		if (existingSubImgPaths.length > 0) {
			const { error: subImgDeleteError } = await supabase.storage
				.from('admin_dashboard_bucket')
				.remove(existingSubImgPaths)

			if (subImgDeleteError) {
				console.error('서브 이미지 삭제 실패:', subImgDeleteError)
				throw { status: 400, message: '서브 이미지 삭제 실패', error: subImgDeleteError }
			}
		}

		// 삭제 할 이미지 경로
		const existingImgPath = oldImagePaths.map((url) => url.replace('admin_dashboard_bucket/', ''))

		// 질문 삭제
		const { error: questionsDeleteError } = await supabase
			.from('mbti_questions')
			.delete()
			.in('test_id', ids)

		if (questionsDeleteError) {
			console.error('질문 삭제 실패:', questionsDeleteError)
			throw { status: 400, message: '질문 삭제 실패', error: questionsDeleteError }
		}

		// 질문 세트 삭제
		const { error: questionSetsDeleteError } = await supabase
			.from('mbti_question_sets')
			.delete()
			.in('test_id', ids)

		if (questionSetsDeleteError) {
			console.error('질문 세트 삭제 실패:', questionSetsDeleteError)
			throw { status: 400, message: '질문 세트 삭제 실패', error: questionSetsDeleteError }
		}

		// 타입 삭제
		const { error: typesDeleteError } = await supabase
			.from('mbti_types')
			.delete()
			.in('test_id', ids)

		if (typesDeleteError) {
			console.error('타입 삭제 실패:', typesDeleteError)
			throw { status: 400, message: '타입 삭제 실패', error: typesDeleteError }
		}

		// 테스트 삭제
		const { error: testsDeleteError } = await supabase.from('mbti_tests').delete().in('id', ids)

		if (testsDeleteError) {
			console.error('테스트 삭제 실패:', testsDeleteError)
			throw { status: 400, message: '테스트 삭제 실패', error: testsDeleteError }
		}

		const { error: imgDeleteError } = await supabase.storage
			.from('admin_dashboard_bucket')
			.remove(existingImgPath)

		if (imgDeleteError) {
			console.error('이미지 삭제 실패:', imgDeleteError)
			throw { status: 400, message: '이미지 삭제 실패', error: imgDeleteError }
		}

		return json({ message: '테스트가 성공적으로 삭제되었습니다.', status: 200 }, { status: 200 })
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
