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

export async function GET({ request }) {
	// 능력고사 테스트 목록 조회 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const url = new URL(request.url)

		const creation_date = url.searchParams.get('creation_date') // 최신순, 오래된순
		const views = url.searchParams.get('views') // 높은순, 낮은순
		const disclosure = url.searchParams.get('disclosure') // 공개, 비공개
		const search = url.searchParams.get('search') // 검색어(ID, 이름)
		const page = parseInt(url.searchParams.get('page') || 1) // 페이지
		const limit = parseInt(url.searchParams.get('limit') || 5) // 페이지당 표시할 개수
		const offset = (page - 1) * limit

		let query = supabase.from('ability_tests').select('*', { count: 'exact' })

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
			query = query.order('count', { ascending: views === '높은순' })
		} else {
			// 다른 정렬 조건이 지정되지 않았을 때 기본적으로 created_at 기준 내림차순으로 정렬
			query = query.order('created_at', { ascending: true })
		}

		// 결과 조회
		const { data, error, count } = await query.range(offset, offset + limit - 1)

		if (error) {
			throw { status: 400, message: '테스트 정보 조회 실패', error: error }
		}

		// 집계 데이터 조회
		const { data: totalData, error: totalDataError } = await supabase
			.from('ability_total')
			.select('*')

		if (totalDataError) {
			throw {
				status: 400,
				message: '테스트 집계 조회 중 오류가 발생했습니다.',
				error: totalDataError
			}
		}

		return json(
			{
				totalData,
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
				message: err.message,
				status: err.status || 400,
				error: err.error || '서버 오류'
			},
			{ status: err.status || 500 }
		)
	}
}

export async function POST({ request }) {
	// 능력고사 테스트 등록 API
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

		// 메인 이미지 업로드
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

		// 서브 이미지 업로드
		await Promise.all(
			questions.map(async (question, index) => {
				const file = formData.get(`sub_img_url_${index}`)
				if (file) {
					const { data: subImgUploadData, error: subImgUploadError } = await supabase.storage
						.from('admin_dashboard_bucket')
						.upload(`abilityTest-sub-images/${Date.now()}_${file.name}`, file, {
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
				message: err.message,
				status: err.status || 400,
				error: err.error || '서버 오류'
			},
			{ status: err.status || 500 }
		)
	}
}

export async function PATCH({ request }) {
	// 능력고사 테스트 공개상태 변경 API
	const authHeader = request.headers.get('authorization')

	const { id, release } = await request.json()

	if (!id || typeof release !== 'boolean') {
		return json(
			{ message: '테스트 ID 또는 release 상태를 올바르게 보내주세요.', status: 400 },
			{ status: 400 }
		)
	}

	try {
		await checkAdminPermission(authHeader)

		const { error } = await supabase
			.from('ability_tests')
			.update({ release: !release })
			.eq('id', id)

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
	// 능력고사 테스트 삭제 API
	const authHeader = request.headers.get('authorization')

	try {
		await checkAdminPermission(authHeader)

		const { ids, oldImagePaths } = await request.json()

		if (ids.length === 0) {
			return json({ message: '삭제할 테스트 ID를 보내주세요.', status: 400 }, { status: 400 })
		}

		if (oldImagePaths.length === 0) {
			return json({ message: '삭제할 이미지 경로를 보내주세요.', status: 400 }, { status: 400 })
		}

		// 질문의 서브 이미지 URL 조회
		const { data: questions, error: questionsFetchError } = await supabase
			.from('ability_questions')
			.select('sub_img_url')
			.in('test_id', ids)

		if (questionsFetchError) {
			console.error('질문 조회 실패:', questionsFetchError)
			throw { status: 400, message: '질문 조회 실패', error: questionsFetchError }
		}

		// 서브 이미지 URL 추출 및 스토리지에서 삭제
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

		// 질문 삭제
		const { error: questionsDeleteError } = await supabase
			.from('ability_questions')
			.delete()
			.in('test_id', ids)

		if (questionsDeleteError) {
			console.error('질문 삭제 실패:', questionsDeleteError)
			throw { status: 400, message: '질문 삭제 실패', error: questionsDeleteError }
		}

		const { error: testsDeleteError } = await supabase.from('ability_tests').delete().in('id', ids)

		if (testsDeleteError) {
			console.error('테스트 삭제 실패:', testsDeleteError)
			throw { status: 400, message: '테스트 삭제 실패', error: testsDeleteError }
		}

		const existingImgPath = oldImagePaths.map((path) => path.replace('admin_dashboard_bucket/', ''))

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
