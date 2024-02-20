import { supabase } from '$lib/util/supabaseClient'
import { json } from '@sveltejs/kit'

export async function GET({ request }) {
	try {
		const { data, error } = await supabase.from('ability_tests').select('*')

		if (error) {
			throw new Error('테스트 정보 조회 실패', error)
		}

		return json(
			{ message: '테스트 목록을 성공적으로 조회했습니다.', status: 'success', data: data },
			{ status: 200 }
		)
	} catch (err) {
		console.error('서버 오류:', err)
		return json(
			{
				message: '서버 오류가 발생했습니다.',
				status: 'error',
				error: err
			},
			{ status: 500 }
		)
	}
}
