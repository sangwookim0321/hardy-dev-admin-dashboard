import { supabase } from '$lib/util/supabaseClient'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	const formData = await request.formData()
	const title = formData.get('title')
	const sub_title = formData.get('sub_title')
	const description = formData.get('description')
	const imgFile = formData.get('img')
	const questions = JSON.parse(formData.get('questions'))

	// 유효성 검사
	if (!title || !sub_title || !description || !imgFile) {
		return json({ message: '모든 필드를 채워주세요.', status: 'error' }, { status: 400 })
	}

	try {
		// 이미지 업로드
		const { data: imgUploadData, error: imgUploadError } = await supabase.storage
			.from('abilityTest-images')
			.upload(`images/${Date.now()}_${imgFile.name}`, imgFile, {
				cacheControl: '3600',
				upsert: false
			})

		if (imgUploadError) {
			console.error('이미지 업로드 실패:', imgUploadError)
			throw new Error('이미지 업로드 실패')
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
			throw new Error('테스트 정보 저장 실패', error)
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
			throw new Error('질문 정보 저장 실패')
		}

		return json(
			{ message: '테스트가 성공적으로 저장되었습니다.', status: 'success' },
			{ status: 200 }
		)
	} catch (err) {
		console.error('서버 오류:', err)
		return json(
			{ message: '서버 오류가 발생했습니다.', status: 'error', details: err.message },
			{ status: 500 }
		)
	}
}
