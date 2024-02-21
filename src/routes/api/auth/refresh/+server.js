import jwt from 'jsonwebtoken'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	// 리프레시 토큰 API
	const { refreshToken } = await request.json()

	if (!refreshToken) {
		throw { status: 401, message: '리프레시 토큰이 없습니다.' }
	}

	try {
		const decoded = jwt.verify(refreshToken, import.meta.env.VITE_APP_JWT_REFRESH_SECRET_KEY)
		const userId = decoded.id

		const accessToken = jwt.sign({ id: userId }, import.meta.env.VITE_APP_JWT_SECRET, {
			expiresIn: '1h'
		})

		return json(
			{ accessToken: accessToken, message: '토큰 갱신 성공', status: 200 },
			{ status: 200 }
		)
	} catch (err) {
		console.log(err)

		if (err instanceof jwt.JsonWebTokenError) {
			return json(
				{ message: '유효하지 않은 토큰입니다.', status: err.status || 401 },
				{ status: 401 }
			)
		} else {
			return json(
				{
					message: `${err.message}`,
					status: err.status || 400
				},
				{ status: err.status || 500 }
			)
		}
	}
}
